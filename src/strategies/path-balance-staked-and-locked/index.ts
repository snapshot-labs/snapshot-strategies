import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { multicall } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const tokenAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const stakingAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

function chunk(array, chunkSize) {
  const tempArray: any[] = [];
  for (let i = 0, len = array.length; i < len; i += chunkSize)
    tempArray.push(array.slice(i, i + chunkSize));
  return tempArray;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakingPool = new Multicaller(network, provider, stakingAbi, { blockTag });
  const tokenPool = new Multicaller(network, provider, tokenAbi, { blockTag });
  
  addresses.forEach((address) => {
    stakingPool.call(address, options.stakingAddress, 'balanceOf', [address]);
    tokenPool.call(address, options.tokenAddress, 'balanceOf', [address]);
 });

 const [stakingResponse, tokenResponse] : [
  Record<string, BigNumberish>,
  Record<string, BigNumberish>
 ] = await Promise.all([stakingPool.execute(), tokenPool.execute()]);

 let callData: [any, string, [any]][] = [];
  addresses.map((address: any) => {
    options.lockedAddresses.map((lockedAddress: any) => {
      callData.push([lockedAddress, options.methodABI.name, [address]]);
    });
  });

  callData = [...chunk(callData, 2000)]; // chunking the callData into multiple arrays of 2000 requests
  let response: any[] = [];
  for (let i = 0; i < callData.length; i++) {
    const tempArray = await multicall(
      network,
      provider,
      [options.methodABI],
      callData[i],
      { blockTag }
    );
    response.push(...tempArray);
  }
  if (options.lockedAddresses.length > 1) {
    // grouping all balances of a particular address together
    const result: any = [];
    response = [].concat.apply([], response);
    for (let i = addresses.length; i > 0; i--) {
      result.push(response.splice(0, Math.ceil(response.length / i)));
    }
    // performing summation over all balances of the user
    response = [];
    result.map((item, index) => {
      let sum = 0;
      result[index].map((element) => {
        sum = sum + parseFloat(formatUnits(element.toString(), 18));
      });
      response.push(sum);
    });
  }
  let lockedRecord: Record<string, number> = {};
  response.map((value, i) => {lockedRecord[addresses[i]] = value});
  
  console.log(response);
  return Object.fromEntries(
    addresses.map((address) => {
      const stakingCount = parseFloat(formatUnits(stakingResponse[address], options.decimals));
      const tokenCount = parseFloat(formatUnits(tokenResponse[address], options.decimals));
      const lockedCount = lockedRecord[address]
      return [address, stakingCount + tokenCount + lockedCount];
    })
  );
}
