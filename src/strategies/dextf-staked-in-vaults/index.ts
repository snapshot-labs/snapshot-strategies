import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'dextf';
export const version = '1.0.0';

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
  addresses.map((userAddress: any) => {
    options.contractAddresses.map((vaultAddress: any) => {
      callData.push([vaultAddress, options.methodABI.name, [userAddress]]);
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
  if (options.contractAddresses.length > 1) {
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
  return Object.fromEntries(
    response.map((value, i) => [addresses[i], options.scoreMultiplier * value])
  );
}
