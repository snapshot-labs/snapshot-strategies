import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'profwobble';
export const version = '0.1.0';


const stickyPoolAbi = ['function voterBalance(address) view returns (uint256)'];

interface Params {
  votingEscrow: string;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Params,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const jellyBalance = await multicall(
    network,
    provider,
    stickyPoolAbi,
    addresses.map((address) => [
      options.votingEscrow,
      'voterBalance',
      [address]
    ]),
    { blockTag }
  );

  
  const userWalletBalances = jellyBalance.map((amount, i) => {
    return [
      addresses[i].toLowerCase(),
      parseFloat(formatUnits(amount.toString(), 18))
    ];
  });

  const userTotal = {};

  userWalletBalances.forEach(([address, amount]) => {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  });

  const finalUserBalances = Object.fromEntries(
    addresses.map((addr) => [getAddress(addr), userTotal[addr.toLowerCase()]])
  );
  console.log(finalUserBalances);
  return finalUserBalances;


}
