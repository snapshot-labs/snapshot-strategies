import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'plind-dm';
export const version = '0.0.1';

const abi = [
  {
    inputs:[
      {internalType:"address",name:"user",type:"address"}
    ],
    name:"lockedBalances",
    outputs:[
      {internalType:"uint256",name:"total",type:"uint256"},
      {internalType:"uint256",name:"unlockable",type:"uint256"},
      {internalType:"uint256",name:"locked",type:"uint256"},
      {components:[{internalType:"uint256",name:"amount",type:"uint256"},{internalType:"uint256",name:"unlockTime",type:"uint256"}],internalType:"struct MultiFeeDistribution.LockedBalance[]",name:"lockData",type:"tuple[]"}
    ],
    stateMutability:"view",
    type:"function"
  }
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

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.multiFeeDistributor, 'lockedBalances', [address])
  );
  const result: Record<string, Object> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balances]) => [
      address,
      parseFloat(formatUnits(balances[2], options.decimals))
    ])
  );
}
