import { formatUnits } from '@ethersproject/units';
import { call, multicall } from '../../utils';

export const author = 'vatsalgupta13';
export const version = '0.1.0';

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
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  let callData: [any, string, [any]][] = [];
  const ratio = await call(provider, options.methodABI, [
    options.contractAddress,
    'ratio',
    []
  ]);
  // console.log('ratio: ', ratio.toString());
  addresses.map((userAddress: any) => {
    callData.push([options.contractAddress, 'balanceOf', [userAddress]]);
  });
  callData = [...chunk(callData, 2000)]; // chunking the callData into multiple arrays of 2000 requests
  const response: any[] = [];
  for (let i = 0; i < callData.length; i++) {
    const tempArray = await multicall(
      network,
      provider,
      options.methodABI,
      callData[i],
      { blockTag }
    );
    response.push(...tempArray);
  }
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      options.scoreMultiplier *
        ratio *
        parseFloat(formatUnits(value.toString(), 18))
    ])
  );
}
