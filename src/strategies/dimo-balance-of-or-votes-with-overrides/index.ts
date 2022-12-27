// import { BigNumberish } from '@ethersproject/bignumber';
// import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
// import { Multicaller } from '../../utils';
import { strategy as erc20VotesWithOverrideStrategy } from '../erc20-votes-with-override';

export const author = '0xMaharishi';
export const version = '0.1.0';
export const nilAddress = '0x0000000000000000000000000000000000000000';
// const abi = [
//   'function delegates(address account) external view returns (address)',
//   'function getVotes(address account) external view returns (uint256)',
//   'function totalSupply() public view returns (uint256)',
//   'function balanceOf(address account) public view returns (uint256)'
// ];

interface Options {
  address: string;
  decimals: number;
  includeSnapshotDelegations?: boolean;
  delegationSpace?: string;
}

/*
  Based on the `erc20-votes-with-override` strategy, with fallback to balanceof
*/
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const checksummedAddresses = addresses.map((address) => getAddress(address));
  const scores: Record<string, number> = await erc20VotesWithOverrideStrategy(
    space,
    network,
    provider,
    checksummedAddresses,
    {
      address: options.address,
      delegatesName: 'delegates',
      balanceOfName: 'balanceOf',
      getVotesName: 'getVotes',
      decimals: options.decimals,
      includeSnapshotDelegations: options.includeSnapshotDelegations,
      delegationSpace: options.delegationSpace
    },
    blockTag
  );

  // const multi = new Multicaller(network, provider, abi, { blockTag });
  // checksummedAddresses.forEach((checksummedAddress) => 
  //   multi.call(checksummedAddress, options.address, 'delegates', [checksummedAddress])
  // );

  // const delegatesResponse: Record<string, string> = await multi.execute();

  // const notDelegated = Object.fromEntries(
  //   Object.entries(delegatesResponse).map(([address, delegatedAddress]) => [
  //     address,
  //     delegatedAddress
  //   ]).filter(([address, delegatedAddress]) => (delegatedAddress === nilAddress))
  // );
  
  // Object.keys(notDelegated).forEach((address) => {
  //   const checksummedAddress = getAddress(address)
  //   multi.call(address, options.address, 'balanceOf', [checksummedAddress])
  // }
  // );
  // const balances: Record<string, BigNumberish> = await multi.execute();

  // const notDelegatedScores = Object.fromEntries(
  //   Object.entries(balances).map(([address, balance]) => [
  //     getAddress(address),
  //     parseFloat(formatUnits(balance, options.decimals))
  //   ])
  // );
  // const finalScores = {...scores, ...notDelegatedScores}
  // console.log(finalScores)
  // const log =  Object.fromEntries(
  //   Object.entries(finalScores).map(([address, score]) => [
  //     getAddress(address),
  //     score
  //   ])
  // );
  // console.log(log)
  return scores;
}