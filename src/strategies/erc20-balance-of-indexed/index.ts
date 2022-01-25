import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = '0xAurelius';
export const version = '0.0.1';

const abi = ['function index() public view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('index', options.indexAddress, 'index');

  const result = await multi.execute();
  const index = parseFloat(formatUnits(result.index, options.indexDecimals));

  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(scores).map((score) => [score[0], score[1] * index])
  );
}
