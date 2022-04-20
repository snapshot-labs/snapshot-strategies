import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, subgraphRequest } from '../../utils';
import abis from './abis/Compound';
// import ALL_TRANSACTIONS_QUERY from './transactions.gql';
export const author = 'usagar80';
export const version = '0.0.1';

const abi = abis;

//gatenet-total-staked
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) => {
    multi.call(address, options.address, 'currentAmount', [address]);
  });
  const result: Record<string, BigNumberish> = await multi.execute();

  for (const address of addresses) {
    const args: {
      where: { sender: string };
    } = {
      where: {
        sender: address
      }
    };

    const query = {
      compoundDeposits: {
        __args: args,
        id: true,
        sender: true,
        amount: true,
        shares: true,
        time: true
      },
      compoundWithdraws: {
        __args: args,
        id: true,
        sender: true,
        amount: true,
        shares: true,
        time: true
      }
    };
    const data = await subgraphRequest(
      'https://api.studio.thegraph.com/query/17252/gatenet-cvm/v0.6.1',
      query
    );
    console.log(data);
    //gatenet-total-staked
  }

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
