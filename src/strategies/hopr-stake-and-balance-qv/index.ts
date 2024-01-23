import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';
import {
  getGnosisBlockNumber,
  getHostedSubgraphUrl,
  getStudioDevSubgraphUrl,
  getStudioProdSubgraphUrl,
  hoprNodeStakeOnChannelsSubgraphQuery,
  hoprTotalOnGnosisSubgraphQuery,
  safeStakeSubgraphQuery,
  trimArray
} from './utils';

/**
 * @dev Calculate score based on Quadratic Voting-like system.
 * Votes should be casted by the admin (owner) account of SafeStake.
 * Token balance comes from
 * - the voter account:
 *   - Mainnet HOPR token balance, read from multicall
 *   - Gnosis chain, HOPR token balance, read from subgraph (xHOPR balance and wxHOPR balance) and multicall (mainnet HOPR balance)
 * - safes created by the "HoprSafeStakeFactory" contract, where the voter account is an owner. Voting account's share of the safe:
 *   - Gnosis chain. Safe's HOPR token balance, read from subgraph (xHOPR balance and wxHOPR balance) and multicall (mainnet HOPR balance)
 *   - Gnosis chain. Safe's HOPR token staked into the production HoprChannels, read from subgraph.
 */
export const author = 'QYuQianchen';
export const version = '0.2.0';

/*
 ******************************************
 *************** PARAMETERS ***************
 ******************************************
 */
const XDAI_BLOCK_HOSTED_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/xdai-blocks'; // convert mainnet block to its corresponding block on Gnosis chain
const tokenAbi = ['function balanceOf(address) view returns (uint256)']; // get mainnet HOPR token balance
const DEFAULT_HOPR_HOSTED_ACCOUNT_NAME = 'hoprnet';
const DEFAULT_FACTOR = 0.75; // Quadratic-voting-like factor

/*
 ********************************************
 **************** CALCULATION ***************
 ********************************************
 */
/**
 * Calculate the final score
 * Note that if the (mainnetBalance + gnosisBalance + safeStakingBalance) <= 1, the score is zero
 * @param mainnetBalance HOPR token balance of the voting account, if the mainnet token balance should be taken into account. Otherwise, zero
 * @param gnosisBalance xHOPR and wxHOPR token balance of the voting account, if the gnosis token balance should be taken into account. Otherwise, zero
 * @param safeStakingBalance Voting account's summed share of all its owned safes, on the xHOPR/wxHOPR token balance and all the stakes in channels by their managed nodes.
 * @param exponent QV-like exponent value. E.g., for quadratic-voting, the exponent is 0.5. This value can be set by the community to any value between 0 and 1, inclusive. Currently it is set at 0.75.
 * @returns calculated score
 */
function calculateScore(
  mainnetBalance: BigNumber,
  gnosisBalance: BigNumber,
  safeStakingBalance: number,
  exponent: number
) {
  const total =
    parseFloat(
      formatUnits(
        gnosisBalance.add(BigNumber.from(mainnetBalance.toString())),
        18
      )
    ) + safeStakingBalance;
  if (total > 1) {
    return Math.pow(total, exponent);
  } else {
    return 0;
  }
}

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // Network must be Ethereum Mainnet
  if (network !== '1') {
    throw new Error('Wrong network! Please use mainnet.');
  }

  // Get the block on mainnet and find the corresponding time on Gnosis chain)
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  // get token balance (if applicable) of voters and block
  const [resHoprOnMainnet, block] = await Promise.all([
    options.useHoprOnMainnet
      ? multicall(
          network,
          provider,
          tokenAbi,
          addresses.map((address: any) => [
            options.tokenAddress,
            'balanceOf',
            [address]
          ]),
          { blockTag }
        )
      : [],
    provider.getBlock(blockTag)
  ]);

  // get the block number for subgraph query
  const subgraphBlock = await getGnosisBlockNumber(
    XDAI_BLOCK_HOSTED_SUBGRAPH_URL,
    block.timestamp,
    options.fallbackGnosisBlock
  );

  // trim addresses to sub of "QUERY_LIMIT" addresses.
  const addressSubsets: string[][] = trimArray(addresses);

  // share of a safe per owner (voter)
  const safeFactor = new Map<string, number>();
  // total stake in Channels of all the nodes managed by the safe
  const safeStakeInChannel = new Map<string, BigNumber>();
  // mapping of owner address to an array of their owned safes
  const ownerSafes = new Map<string, string[]>();

  if (options.useSafeStake) {
    // array of nodes per safe
    const safeNodes = new Map<string, string[]>();
    // array of all the nodes managed by the safes where its owner is a voter
    const nodes: string[] = [];
    // Find the list of Safes (created by HoprStakeFactory contract) where the voting account is an owner,
    // as well as the total number of owners of each safe
    // construct URLs for safe stake subgraph
    const hostedSafeStakeSubgraphUrl = getHostedSubgraphUrl(
      options.subgraphHostedAccountName ?? DEFAULT_HOPR_HOSTED_ACCOUNT_NAME,
      options.subgraphHostedSafeStakeSubgraphName
    );
    const stuidoDevSafeStakeSubgraphUrl = getStudioDevSubgraphUrl(
      options.subgraphStudioDevAccountId,
      options.subgraphStudioDevSafeStakeSubgraphName,
      options.subgraphStudioDevSafeStakeVersion
    );
    const studioProdSafeStakeSubgraphUrl = getStudioProdSubgraphUrl(
      options.subgraphStudioProdQueryApiKey,
      options.subgraphStudioProdSafeStakeQueryId
    );
    // get subgraph result for stake season
    const returnedFromSubgraphStake = await Promise.all(
      addressSubsets.map((subset) =>
        safeStakeSubgraphQuery(
          hostedSafeStakeSubgraphUrl,
          stuidoDevSafeStakeSubgraphUrl,
          studioProdSafeStakeSubgraphUrl,
          subset,
          subgraphBlock,
          snapshot
        )
      )
    );
    // parse the returned value
    returnedFromSubgraphStake.forEach((resultSubset) => {
      resultSubset.forEach((safe) => {
        // 1. safe -> nodes
        safeNodes.set(safe.safeAddress, safe.nodes);
        nodes.concat(safe.nodes);
        if (safe.owners.length == 0) {
          // 2. safe -> factor
          safeFactor.set(safe.safeAddress, 0);
        } else {
          // 2. safe -> factor
          safeFactor.set(safe.safeAddress, 1 / safe.owners.length);
          safe.owners.forEach((owner) => {
            const registeredSafes = ownerSafes.get(owner) ?? [];
            // 3. owner -> safes
            ownerSafes.set(owner, [...registeredSafes, safe.safeAddress]);
          });
        }
      });
    });
    // trim addresses to sub of "QUERY_LIMIT" addresses.
    const nodesSubsets: string[][] = trimArray(nodes);

    // when safe stake is used, check if channel stake is used
    if (options.useChannelStake) {
      // construct URLs for HOPR channels
      const hostedChannelsSubgraphUrl = getHostedSubgraphUrl(
        options.subgraphHostedAccountName ?? DEFAULT_HOPR_HOSTED_ACCOUNT_NAME,
        options.subgraphHostedChannelsSubgraphName
      );
      const stuidoDevChannelsSubgraphUrl = getStudioDevSubgraphUrl(
        options.subgraphStudioDevAccountId,
        options.subgraphStudioDevChannelsSubgraphName,
        options.subgraphStudioDevChannelsVersion
      );
      const studioProdChannelsSubgraphUrl = getStudioProdSubgraphUrl(
        options.subgraphStudioProdQueryApiKey,
        options.subgraphStudioProdChannelsQueryId
      );
      // get subgraph result for hopr on gnosis
      const returnedFromSubgraphChannels = await Promise.all(
        nodesSubsets.map((subset) =>
          hoprNodeStakeOnChannelsSubgraphQuery(
            hostedChannelsSubgraphUrl,
            stuidoDevChannelsSubgraphUrl,
            studioProdChannelsSubgraphUrl,
            subset,
            subgraphBlock,
            snapshot
          )
        )
      );
      // node-wxHOPR balance staked in Channels
      const subgraphNodeStakeInChannels = Object.assign(
        {},
        ...returnedFromSubgraphChannels
      );
      // parse the returned value from channels
      for (const key of safeNodes.keys()) {
        const nodesManagedBySafe = safeNodes.get(key);
        // populate safeStakeInChannel with safeAddress as key and the sum of all the stakes in nodes
        if (!nodesManagedBySafe || nodesManagedBySafe.length == 0) {
          safeStakeInChannel.set(key, BigNumber.from('0'));
        } else {
          const stakesInNodes = nodesManagedBySafe.reduce(
            (acc, cur) =>
              (acc = acc.add(
                parseUnits(subgraphNodeStakeInChannels[cur] ?? '0', 18)
              )),
            BigNumber.from('0')
          );
          safeStakeInChannel.set(key, stakesInNodes);
        }
      }
    }
  }

  // trim addresses to sub of "QUERY_LIMIT" addresses.
  const addressWithSafesSubsets: string[][] = trimArray(
    addresses.concat(Array.from(safeFactor.keys()))
  );

  let returnedFromSubgraphOnGnosis;
  if (options.useHoprOnGnosis) {
    // construct URLs for HOPR on Gnosis
    const hostedHoprOnGnosisSubgraphUrl = getHostedSubgraphUrl(
      options.subgraphHostedAccountName ?? DEFAULT_HOPR_HOSTED_ACCOUNT_NAME,
      options.subgraphHostedHoprOnGnosisSubgraphName
    );
    const stuidoDevHoprOnGnosisSubgraphUrl = getStudioDevSubgraphUrl(
      options.subgraphStudioDevAccountId,
      options.subgraphStudioDevHoprOnGnosisSubgraphName,
      options.subgraphStudioDevHoprOnGnosisVersion
    );
    const studioProdHoprOnGnosisSubgraphUrl = getStudioProdSubgraphUrl(
      options.subgraphStudioProdQueryApiKey,
      options.subgraphStudioProdHoprOnGnosisQueryId
    );
    // get subgraph result for hopr on gnosis
    returnedFromSubgraphOnGnosis = await Promise.all(
      addressWithSafesSubsets.map((subset) =>
        hoprTotalOnGnosisSubgraphQuery(
          hostedHoprOnGnosisSubgraphUrl,
          stuidoDevHoprOnGnosisSubgraphUrl,
          studioProdHoprOnGnosisSubgraphUrl,
          subset,
          subgraphBlock,
          snapshot
        )
      )
    );
  }

  // get and parse balance from subgraph
  const subgraphTokenBalanceOnGnosis: { [propName: string]: BigNumber } =
    Object.assign({}, ...returnedFromSubgraphOnGnosis);

  // sum of all the safes owned by the voting account
  // = sum{ factor * (safe's x/wxHOPR balance + wxHOPR tokens staked in the Channels) }
  const summedStakePerSafe = addresses.map((address) => {
    // from the voting address, get all the safe addresses
    const safes = ownerSafes.get(address) ?? [];
    if (safes.length == 0) {
      return BigNumber.from('0');
    } else {
      return safes.reduce((acc, curSafe) => {
        // factor * (x/wxHOPR token balance + safe stake in channels)
        const curSafeFactor = safeFactor.get(curSafe) ?? 0;
        if (curSafeFactor == 0) {
          return acc;
        }
        const curSafeTokenBalance =
          subgraphTokenBalanceOnGnosis[curSafe.toLowerCase()] ??
          BigNumber.from('0');
        const curSafeStakeInChannels =
          safeStakeInChannel.get(curSafe.toLowerCase()) ?? BigNumber.from('0');
        return (
          acc +
          curSafeFactor *
            parseFloat(
              formatUnits(curSafeTokenBalance.add(curSafeStakeInChannels), 18)
            )
        );
      });
    }
  });

  // return sqrt(subgraph score + hopr on mainet score)
  return Object.fromEntries(
    addresses.map((adr, i) => [
      adr,
      calculateScore(
        options.useHoprOnMainnet ? resHoprOnMainnet[i] : BigNumber.from('0'),
        options.useHoprOnGnosis
          ? subgraphTokenBalanceOnGnosis[adr.toLowerCase()] ??
              BigNumber.from('0')
          : BigNumber.from('0'),
        summedStakePerSafe[i],
        parseFloat(options.exponent ?? DEFAULT_FACTOR)
      )
    ])
  );
}
