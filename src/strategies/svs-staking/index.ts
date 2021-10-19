import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'fsjuhl';
export const version = '0.1.0';

const stakingAbi = [{
    "inputs":[{
        "internalType": "address",
        "name": "burier",
        "type": "address"
    }],
    "name": "getVampsBuried",
    "outputs":[{
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
    }],
    "stateMutability": "view",
    "type": "function"
}];

const tokenAbi = [{
    "inputs":[{
        "internalType":"address",
        "name":"owner",
        "type":"address"
    }],
    "name":"balanceOf",
    "outputs":[{
        "internalType":"uint256",
        "name":"",
        "type":"uint256"
    }],
    "stateMutability":"view",
    "type":"function"
 }];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const stakersResponse = await multicall(
    network,
    provider,
    stakingAbi,
    addresses.map((address: any) => [
      options.stakingAddress,
      'getVampsBuried',
      [address]
    ]),
    { blockTag }
  );

  const holdersResponse = await multicall(
    network,
    provider,
    tokenAbi,
    addresses.map((address: any) => [
      options.tokenAddress,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    stakersResponse.map((value, i) => [
      addresses[i],
      value[0].length + parseFloat(formatUnits(holdersResponse[i][0].toString(), options.decimals))
    ])
  );
}
