import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'shinitakunai';
export const version = '0.1.0';

const abi = [
  'function getPoolTokens(bytes32 poolId) external view returns (address[], uint256[], uint256)',
  'function totalSupply() external view returns (uint256)',
  'function balances(address owner) external view returns (uint256)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('poolTokens', options.balancerVaultAddress, 'getPoolTokens', [
    options.poolId
  ]);
  multi.call('lpTokenTotalSupply', options.poolAddress, 'totalSupply', []);
  addresses.forEach((address) =>
    multi.call(`userBalances.${address}`, options.farmAddress, 'balances', [
      address
    ])
  );

  const {
    poolTokens: [tokens, balances],
    lpTokenTotalSupply,
    userBalances
  } = await multi.execute();

  const vstaIndex = tokens.findIndex(
    (address) => address.toLowerCase() === options.vstaAddress.toLowerCase()
  );

  const vstaPerLp = balances[vstaIndex].div(lpTokenTotalSupply);

  const result = Object.fromEntries(
    Object.entries(userBalances).map(([address, lpBalance]) => [
      getAddress(address),
      parseFloat(formatUnits(vstaPerLp.mul(lpBalance), options.decimals))
    ])
  );

  return result;
}
