import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'streamr-dev';
export const version = '0.1.1';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

const abi = [
  'function balanceOf(address account) external view returns (uint256)', // in DATA token
  'function operators(address owner) external view returns (address)', // in OperatorFactory, returns operator contract address
  'function valueWithoutEarnings() external view returns (uint)' // in Operator contract
];

type Balances = {
  tokens: BigNumber;
  staked?: BigNumber;
};

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // find the Operator contract deployed by the DATA token holder, will return ADDRESS_ZERO if not found
  const getContractOf = new Multicaller(network, provider, abi, { blockTag });
  for (const tokenHolder of addresses) {
    getContractOf.call(
      tokenHolder,
      options.operatorFactoryAddress,
      'operators',
      [tokenHolder]
    );
  }
  const contractOf: Record<string, string> = await getContractOf.execute();

  // get both the "cash in hand", and DATA tokens staked through the Operator contract (Operator value)
  const getBalances = new Multicaller(network, provider, abi, { blockTag });
  for (const tokenHolder of addresses) {
    getBalances.call(
      `${tokenHolder}.tokens`,
      options.tokenAddress,
      'balanceOf',
      [tokenHolder]
    );
    if (contractOf[tokenHolder] != ADDRESS_ZERO) {
      getBalances.call(
        `${tokenHolder}.staked`,
        contractOf[tokenHolder],
        'valueWithoutEarnings',
        []
      );
    }
  }
  const balances: Record<string, Balances> = await getBalances.execute();

  return Object.fromEntries(
    Object.entries(balances).map(
      ([address, { tokens, staked = BigNumber.from(0) }]) => [
        address,
        parseFloat(formatEther(tokens.add(staked)))
      ]
    )
  );
}
