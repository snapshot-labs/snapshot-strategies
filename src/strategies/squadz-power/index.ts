import { multicall } from '../../utils';

export const author = 'EzraWeller';
export const version = '0.0.1';

const engineAddresses: { [network: string]: string } = {
  '5': '0x7beaa4e60e0faab603e99813f0f2330704b53086',
  '80001': '0x39235b78626d8fa4ef6a81ba5616c58708ba4ea5',
  '137': '0xb4a1a96ffa514b295b9a0de127288ec7d09e4e7c',
  '4': '0xbeea7483aef24502a27eb7a35aad55280f8e2ebc'
};

const engineAbi = [
  'function getMemberInfo(address, uint256, address) view returns (uint256, uint256, uint256, bool, bool, uint256, uint256)'
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

  if (!Object.keys(engineAddresses).includes(network))
    throw new Error(
      'Invalid network:' + network + 'not in' + Object.keys(engineAddresses)
    );

  const engineAddress = engineAddresses[network];
  const forkNumber = options.forkNumber ?? 0;

  const response = await multicall(
    network,
    provider,
    engineAbi,
    addresses.map((member) => [
      engineAddress,
      'getMemberInfo',
      [options.collectionAddress, forkNumber, member]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [addresses[i], parseInt(value[5])])
  );
}
