import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'ethlizards';
export const version = '0.1.0';

const abi = [
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function sumDepositAmounts(address depositToken, address rewardToken, address accountAddress) external view returns (uint96)',
  // TODO: introduce sumVestedAmounts(address holder) function
  'function getVestingSchedulesArray(address holder) external view returns (tuple(uint32 startDate, uint32 duration, uint96 amountVested, uint96 amountClaimed)[])'
];

interface Options {
  lizcoinAddress: string;
  cLIZAddress: string;
  vLIZAddress: string;
  veLIZAddress: string;
  cLIZConversionRate: number;
  vLIZConversionRate: number;
  veLIZConversionRate: number;
  uniswapV2PoolAddress: string;
  stakingContractAddress: string;
  vestingContractAddress: string;
}

interface VestingSchedule {
  startDate: number;
  duration: number;
  amountVested: BigNumber;
  amountClaimed: BigNumber;
}

export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: Options,
  snapshot: number | 'latest'
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  // Fetch decimals for LIZ, vLIZ, veLIZ, and LP
  multi.call('lizcoinDecimals', options.lizcoinAddress, 'decimals');
  multi.call('vLIZDecimals', options.vLIZAddress, 'decimals');
  multi.call('veLIZDecimals', options.veLIZAddress, 'decimals');
  multi.call('lpDecimals', options.uniswapV2PoolAddress, 'decimals');
  // Fetch LP/LIZ conversion rate
  multi.call('lpSupply', options.uniswapV2PoolAddress, 'totalSupply');
  multi.call('lpLizcoinBalance', options.lizcoinAddress, 'balanceOf', [
    options.uniswapV2PoolAddress
  ]);

  // Fetch balances for LIZ, vLIZ, and veLIZ
  addresses.forEach((address: string) => {
    // Staked $LIZ
    multi.call(
      `stakedLIZ_${address}`,
      options.stakingContractAddress,
      'sumDepositAmounts',
      [options.lizcoinAddress, options.lizcoinAddress, address]
    );
    // Staked LP tokens
    multi.call(
      `stakedLP_${address}`,
      options.stakingContractAddress,
      'sumDepositAmounts',
      [options.uniswapV2PoolAddress, options.lizcoinAddress, address]
    );
    // vLIZ pre-tokens (investors) in a wallet
    multi.call(`vLIZ_${address}`, options.vLIZAddress, 'balanceOf', [address]);
    // veLIZ pre-tokens (team) in a wallet
    multi.call(`veLIZ_${address}`, options.veLIZAddress, 'balanceOf', [
      address
    ]);
    // ANY position in the pre-token vesting contract, whether it came from vLIZ, veLIZ, or was set manually for e.g. KOLs
    multi.call(
      `vestingSchedules_${address}`,
      options.vestingContractAddress,
      'getVestingSchedulesArray',
      [address]
    );
  });

  const result: Record<string, BigNumberish> = await multi.execute();

  // decimals
  const lizcoinDecimals = result['lizcoinDecimals'];
  const vLIZDecimals = result['vLIZDecimals'];
  const veLIZDecimals = result['veLIZDecimals'];
  const lpDecimals = result['lpDecimals'];
  // LP/LIZ conversion rate
  const lpSupply = parseFloat(formatUnits(result['lpSupply'], lpDecimals));
  const lpLizcoinBalance = parseFloat(
    formatUnits(result['lpLizcoinBalance'], lpDecimals)
  );
  const lpLizcoinConvRate = lpSupply / lpLizcoinBalance / 2;

  // derive the voting power as an address:number mapping
  const votingPower = Object.fromEntries(
    addresses.map(function (address) {
      // Staked $LIZ
      const stakedLizcoinBalance = parseFloat(
        formatUnits(result[`stakedLIZ_${address}`], lizcoinDecimals)
      );

      // Staked LP tokens (converted back to their value in $LIZ)
      const stakedLpBalance =
        parseFloat(
          formatUnits(result[`stakedLP_${address}`], lizcoinDecimals)
        ) / lpLizcoinConvRate;

      // vLIZ pre-tokens (investors) in a wallet (converted to their value in $LIZ)
      const vLIZBalance =
        parseFloat(formatUnits(result[`vLIZ_${address}`], vLIZDecimals)) /
        options.vLIZConversionRate;

      // veLIZ pre-tokens (team) in a wallet (converted to their value in $LIZ)
      const veLIZBalance =
        parseFloat(formatUnits(result[`veLIZ_${address}`], veLIZDecimals)) /
        options.veLIZConversionRate;

      // ANY position in the pre-token vesting contract, whether it came from vLIZ, veLIZ, or was set manually for e.g. KOLs
      const schedules: VestingSchedule[] = result[
        `vestingSchedules_${address}`
      ] as unknown as VestingSchedule[];
      const vestedAmountsSum = schedules.reduce(
        (accumulator, currentValue) =>
          BigNumber.from(accumulator).add(
            BigNumber.from(currentValue.amountVested).sub(
              BigNumber.from(currentValue.amountClaimed)
            )
          ),
        BigNumber.from(0)
      );
      const vestedLizcoinBalance = parseFloat(
        formatUnits(vestedAmountsSum, lizcoinDecimals)
      );

      // sum all the balances (already converted to LIZ equivalents)
      const totalBalance =
        stakedLizcoinBalance +
        stakedLpBalance +
        vLIZBalance +
        veLIZBalance +
        vestedLizcoinBalance;

      // apply the quadratic voting formula and return
      return [address, Math.sqrt(totalBalance)];
    })
  );
  // console.log(votingPower);
  return votingPower;
}
