import { multicall } from '../../utils';

export const author = 'AngelDAO';
export const version = '0.1.0';

const abi = [
  {
    "inputs":[
       {
          "name":"",
          "type":"uint256"
       }
    ],
    "name":"rocks",
    "outputs":[
       {
          "name":"owner",
          "type":"address"
       },
       {
          "name":"currentlyForSale",
          "type":"bool"
       },
       {
          "name":"price",
          "type":"uint256"
       },
       {
          "name":"timesSold",
          "type":"uint256"
       }
    ],
    "payable":false,
    "stateMutability":"view",
    "type":"function"
 }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  let calls = [] as  any;
  for (var i=0; i< 100; i++){
    calls.push([
      options.address,
      'rocks',
      [i]
    ])
  }

  const response = await multicall(
    network,
    provider,
    abi,
    calls,
    { blockTag }
  );

  let result ={} as  any;

  addresses.forEach((address, x)=> {
    let addressRocks=0;
    response.forEach((rockObject, i) => {
        if (rockObject.owner == address){
          addressRocks++;
        }
    })
    result[address] = addressRocks
  })

  return result;
}
