// import { getAddress } from '@ethersproject/address';
// import { BigNumberish } from '@ethersproject/bignumber';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'amibenson';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  console.log(`Strategy Called with ${snapshot}, ${network}`);
  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('availableLiquidity', options.underlyingToken, 'balanceOf', [
    options.lpToken
  ]);
  multi.call('lpTokenTotalSupply', options.lpToken, 'totalSupply');
  multi.call('lpTokenDecimals', options.lpToken, 'decimals');
  multi.call('underlyingTokenDecimals', options.underlyingToken, 'decimals');
  const {
    availableLiquidity,
    lpTokenTotalSupply,
    lpTokenDecimals,
    underlyingTokenDecimals
  } = await multi.execute();

  const rate =
    parseFloat(formatUnits(availableLiquidity, underlyingTokenDecimals)) /
    parseFloat(formatUnits(lpTokenTotalSupply, lpTokenDecimals));

  // console.log(
  //   `rate: ${rate} = ${parseFloat(
  //     formatUnits(availableLiquidity, underlyingTokenDecimals)
  //   )} / ${parseFloat(formatUnits(lpTokenTotalSupply, lpTokenDecimals))}`
  // );

  const scoresPerlpToken = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: options.lpToken,
      decimals: lpTokenDecimals
    },
    snapshot
  );

  const scoresPerUnderlyingToken = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: options.underlyingToken,
      decimals: underlyingTokenDecimals
    },
    snapshot
  );

  const rtScores = Object.fromEntries(
    Object.entries(scoresPerlpToken).map(([address, balance]) => {
      // console.log(
      //   `${network} address ${address}  has balance ${balance} xGOVI + ${
      //     scoresPerUnderlyingToken[address]
      //   } GOVI therefore by rate we have ${balance * rate}`
      // );
      return [address, balance * rate + scoresPerUnderlyingToken[address]];
    })
  );

  // console.log(
  //   `strategy returns rtScores: ${JSON.stringify(rtScores, null, 2)}`
  // );

  return rtScores;
}
