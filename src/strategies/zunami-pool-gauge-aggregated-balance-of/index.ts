import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { call, Multicaller } from '../../utils';

export const author = 'fextr';
export const version = '1.0.1';

const zunamiSnapshotHelperAbi = [
  'function aggregatedBalanceOf(address _account) external view returns (uint256)'
];
const fraxStakingAbi = [
  'function lockedLiquidityOf(address account) external view returns (uint256)'
];
const curveAbi = ['function get_virtual_price() view returns (uint256)'];

interface StrategyOptions {
  address: string;
  decimals: number;
  lpPriceDecimals: number;
  curvePoolAddress: string;
  fraxStakingAddress: string;
  blackListAddresses: string[];
}

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options: StrategyOptions,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const lpPrice = parseFloat(
    formatUnits(
      await call(
        provider,
        curveAbi,
        [options.curvePoolAddress, 'get_virtual_price'],
        { blockTag }
      ),
      options.lpPriceDecimals
    )
  );

  const blackListAddressesArr = Array.from(options.blackListAddresses).map(
    (address) => address.toLowerCase()
  );
  const filteredAddresses = addresses.filter(
    (address) => !blackListAddressesArr.includes(address.toLowerCase())
  );

  const aggregatedResult: Record<string, BigNumberish> =
    await getAggregatedBalance(
      network,
      provider,
      blockTag,
      filteredAddresses,
      options.address
    );

  const fraxStakingResult: Record<string, BigNumberish> =
    await getFraxStakingBalance(
      network,
      provider,
      blockTag,
      filteredAddresses,
      options.fraxStakingAddress
    );

  const result: [string, BigNumberish][] = mergeResults(
    aggregatedResult,
    fraxStakingResult
  );

  return Object.fromEntries(
    result.map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals)) * lpPrice
    ])
  );
}

async function getFraxStakingBalance(
  network,
  provider,
  blockTag,
  filteredAddresses: string[],
  fraxStakingAddress: string
): Promise<Record<string, BigNumberish>> {
  const fraxStakingMulti = new Multicaller(network, provider, fraxStakingAbi, {
    blockTag
  });
  filteredAddresses.forEach((address) =>
    fraxStakingMulti.call(address, fraxStakingAddress, 'lockedLiquidityOf', [
      address
    ])
  );
  const fraxStakingResult: Record<string, BigNumberish> =
    await fraxStakingMulti.execute();

  return fraxStakingResult;
}

async function getAggregatedBalance(
  network,
  provider,
  blockTag,
  filteredAddresses: string[],
  contractAddress: string
): Promise<Record<string, BigNumberish>> {
  const multi = new Multicaller(network, provider, zunamiSnapshotHelperAbi, {
    blockTag
  });
  filteredAddresses.forEach((address) =>
    multi.call(address, contractAddress, 'aggregatedBalanceOf', [address])
  );
  const aggregatedResult: Record<string, BigNumberish> = await multi.execute();

  return aggregatedResult;
}

function mergeResults(
  aggregatedResult: Record<string, BigNumberish>,
  fraxStakingResult: Record<string, BigNumberish>
): [string, BigNumberish][] {
  const fraxStakingEntries = Object.entries(fraxStakingResult);
  const fraxStakingResultMap: Map<string, BigNumberish> = new Map(
    fraxStakingEntries
  );
  const aggregatedPlusStaking: [string, BigNumberish][] = Object.entries(
    aggregatedResult
  ).map(([address, balance]) => {
    const fraxStakingBalance = fraxStakingResultMap.get(address);
    if (fraxStakingBalance) {
      return [
        address,
        BigNumber.from(balance).add(BigNumber.from(fraxStakingBalance))
      ];
    }
    return [address, balance];
  });
  const aggregatedPluStakingMap: Map<string, BigNumberish> = new Map(
    aggregatedPlusStaking
  );
  fraxStakingEntries.map(([address, balance]) => {
    if (!aggregatedPluStakingMap.has(address)) {
      aggregatedPlusStaking.push([address, balance]);
    }
  });

  return aggregatedPlusStaking;
}
