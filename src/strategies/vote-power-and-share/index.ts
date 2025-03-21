import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { multicall } from '../../utils';

export const author = 'jinanton';
export const version = '0.1.0';

const abi = ['function totalSupply() public returns (uint256)'];

enum PowerType {
  VotingPower = 'votingPower',
  ShareOfTotalSupply = 'shareOfTotalSupply'
}

interface Options {
  address: string;
  decimals: number;
  symbol: string;
  powerType: PowerType;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Options,
  snapshot
) {
  const poolShares = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const totalPoolShares = await multicall(
    network,
    provider,
    abi,
    [[options.address, 'totalSupply']],
    { blockTag }
  );

  if (
    !totalPoolShares ||
    !Object.keys(poolShares).length ||
    (options.powerType != PowerType.ShareOfTotalSupply &&
      options.powerType != PowerType.VotingPower)
  )
    return {};
  const totalShares = parseFloat(
    formatUnits(totalPoolShares.toString(), options.decimals)
  );

  if (options.powerType == PowerType.ShareOfTotalSupply) {
    return Object.fromEntries(
      Object.entries(poolShares).map((account) => [
        account[0],
        account[1] / totalShares
      ])
    );
  }
  return Object.fromEntries(
    Object.entries(poolShares).map((account) => [account[0], account[1]])
  );
}
