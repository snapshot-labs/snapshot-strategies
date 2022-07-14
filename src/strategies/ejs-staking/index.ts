import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { getSnapshots, subgraphRequest } from '../../utils';

export const author = 'terence-ejs';
export const version = '0.0.1';

// Graph endpoint urls
const EJS_SUBGRAPH_URL = {
  '97': 'https://api.thegraph.com/subgraphs/name/enjinstarter/ejs-staking-service-chapel'
};

// Default decimal places for votes
const DEFAULT_DECIMALS = 0;

// Subgraph query
const getGraphQLQuery = (addresses, blockTag) => {

  // Ignore block if latest block
  const block = blockTag === 'latest' ? null : { number: blockTag };

  return {
    endusers: {
      __args: {
        where: {
          id_in: addresses
        },
        block
      },
      id: true,
      stakes: {
        stakingPool: {
          id: true
        },
        stakeAmountWei: true,
        stakeMaturityTimestamp: true,
        isSuspended: true
      }
    }
  };
};

// Path to identify unique settings pool
const SEPERATOR = '|';
const encodePath = (networkId, poolId) => [networkId, poolId].join(SEPERATOR);

// Types
interface Params {
  stakingServiceContractAddress: string,
  voteEndDate: string,
  decimals, number,
  stakingPoolSettings: Array<StakingPoolSetting>,
  legacyData: Array<StakeInfo>
};

interface StakingPoolSetting {
  pools: Array<Pool>
  lotSizePerVote: string,
  minimumTokensToVote: string,
};

interface Pool {
  poolId: string,
  networkId: string,
  legacy: boolean
};

interface StakeInfo {
  address: string,
  networkId: string,
  poolId: string,
  stakeAmountWei: string,
  stakeMaturityTimestamp: string,
  isSuspended: boolean
};

interface ProcessedStakeInfo {
  address: string,
  settingsIndex: number,
  stakeAmountWei: BigNumber,
  stakeMaturityTimestamp: BigNumber,
  isSuspended: boolean
};

// Strategy
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Params,
  snapshot
): Promise<Record<string, number>> {

  // Map networkId and poolId to each setting
  const { stakingPoolSettings } = options;

  const settingsIndices: Record<string, number> = Object.fromEntries(
    stakingPoolSettings.flatMap((stakingPoolSetting, index) => {
      return stakingPoolSetting.pools.map(pool => {
        const path = encodePath(pool.networkId, pool.poolId);
        return [path, index];
      });
    })
  );

  // Get list of networkIds
  const networkIds: Array<string> = stakingPoolSettings
    .flatMap(setting => setting.pools)
    .map(pool => pool.networkId)
    // unique
    .filter((element, index, array) => {
      return array.indexOf(element) == index;
    });

  // Get blocktag for for each network id based on blocktag of main network
  const mainBlockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const blocks = await getSnapshots(
    network,
    mainBlockTag,
    provider,
    networkIds
  );

  const blockArray = Object.entries(blocks);

  // Call graph for each network
  const promises = blockArray.map(([network, block]) => {

    // Get url of subgraph
    const url = EJS_SUBGRAPH_URL[network];

    // If subgraph doesn't exist, we skip
    if (url === undefined) return null;

    // Call graph with query
    const query = getGraphQLQuery(addresses, block);
    return subgraphRequest(EJS_SUBGRAPH_URL[network], query);
  });

  const results = await Promise.all(promises);

  // Process results
  const subgraphData: Array<StakeInfo> = results.flatMap((result, index) => {

    // If subgraph didnt't exist, we skip
    if (result === null) return [];

    // Convert data structure of results into StakeInfo
    return result.endusers.flatMap(endUser => {
      return endUser.stakes.map(stake => {
        return {
          address: endUser.id,
          networkId: blockArray[index][0],
          poolId: stake.stakingPool.id,
          stakeAmountWei: stake.stakeAmountWei,
          stakeMaturityTimestamp: stake.stakeMaturityTimestamp,
          isSuspended: stake.isSuspended
        };
      });
    });
  });

  // Add legacy data if given
  const { legacyData } = options;
  const allData = subgraphData.concat(legacyData ?? []);

  // Convert data structure from StakeInfo to ProcessedStakeInfo
  const data: Array<ProcessedStakeInfo> = allData.flatMap(stakeInfo => {
    const { address, networkId, poolId, stakeAmountWei, stakeMaturityTimestamp, isSuspended } = stakeInfo;

    // Get settingsIndex
    const path = encodePath(networkId, poolId);
    const settingsIndex = settingsIndices[path];

    // If settings for network and pool doesn't exist, we skip
    if (settingsIndex === undefined) return [];

    return [{
      address,
      settingsIndex,
      // Convert string to BigNumber
      stakeAmountWei: BigNumber.from(stakeAmountWei),
      stakeMaturityTimestamp: BigNumber.from(stakeMaturityTimestamp),
      // isSuspended default false
      isSuspended: isSuspended !== undefined ? isSuspended : false
    }];
  });

  // Group data by address
  const dataByAddress: Record<string, Array<ProcessedStakeInfo>> = data.reduce((result, element) => {
    (result[element.address] = result[element.address] || []).push(element);
    return result;
  }, {});

  // Calculate votes

  // Loop results by address
  const totalVotes = Object.entries(dataByAddress).map(([address, stakeInfos]) => {

    // Group results by settingsIndex
    const groups: Record<string, Array<ProcessedStakeInfo>> = stakeInfos.reduce((result, element) => {
      (result[element.settingsIndex] = result[element.settingsIndex] || []).push(element);
      return result;
    }, {});

    // Calculate vote lots for each group of stake
    const lots = Object.entries(groups).map(([settingsIndex, stakeInfos]) => {

      // Get maturity date in epoch
      const { voteEndDate } = options;
      const voteEndEpoch = Math.floor(Date.parse(voteEndDate) / 1000);

      const nonMatureTokens = stakeInfos
        // Check suspended
        .filter(stakeInfo => !stakeInfo.isSuspended)
        // Check maturity of each stake
        .filter(stakeInfo => stakeInfo.stakeMaturityTimestamp.gte(voteEndEpoch))
        // Get stake
        .map(stakeInfo => stakeInfo.stakeAmountWei)
        // Sum stake
        .reduce((result, element) => result.add(element), BigNumber.from(0));

      // Get settings for current stake setting
      const settings = stakingPoolSettings[settingsIndex];
      const { minimumTokensToVote, lotSizePerVote } = settings;

      // Check minimum token
      if (nonMatureTokens.lt(minimumTokensToVote)) {
        return BigNumber.from(0);
      }

      // Calculate vote from lot size
      // Result is automatically truncated as big number doesn't have decimal places
      return nonMatureTokens.div(lotSizePerVote);
    });

    // Calculate total lots for address
    const totalLots = lots.reduce((result, element) => result.add(element), BigNumber.from(0));

    // Convert lots into votes
    const decimals = options.decimals || DEFAULT_DECIMALS;
    const votes = parseFloat(formatUnits(totalLots, decimals));

    return [address, votes];
  });

  return Object.fromEntries(totalVotes);
};
