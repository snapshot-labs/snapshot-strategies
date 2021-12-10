import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';


export const author = 'drgorillamd';
export const version = '1.0.0';

const abi = ['function pendingRewards(uint256,address) external view returns(uint256)',
'function userInfo(address,uint256) external view returns(uint256 amount,uint256,uint256,uint256)',
'function balanceOf(address) external view returns(uint256)'];


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
    multi.call(address+"-staked", options.pool, 'userInfo', [address, '1']) // uint
    multi.call(address+"-pendingReward", options.pool, 'pendingRewards', ['1', address])// .amount: uint
    multi.call(address+"-balance", options.token, 'balanceOf', [address]);
  });

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    addresses.map( (adr) => {
      let bal = result[adr+"-staked"]['amount'];
      bal = bal.add(result[adr+"-pendingReward"]);
      bal = bal.add(result[adr+"-balance"]);

      return [adr, parseFloat(formatUnits(bal, options.decimals))];
    })
  );


}