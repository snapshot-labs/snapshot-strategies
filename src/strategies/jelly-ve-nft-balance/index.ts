import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'JellyProtocol';
export const version = '0.1.3';


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

  const veAbi = ['function voterBalance(address) view returns (uint256)'];
  const voterBalance = await multicall(
    network,
    provider,
    veAbi,
    addresses.map((address) => [
      options.votingEscrow,
      'voterBalance',
      [address]
    ]),
    { blockTag }
  );
  
  const userVoteBalances = voterBalance.map((amount, i) => {
    return [
      addresses[i].toLowerCase(),
      parseFloat(formatUnits(amount.toString(), 18))
    ];
  });

  const userTotal = {};

  userVoteBalances.forEach(([address, amount]) => {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  });

  const finalVoteBalances = Object.fromEntries(
    addresses.map((addr) => [getAddress(addr), userTotal[addr.toLowerCase()]])
  );
  return finalVoteBalances;

}
