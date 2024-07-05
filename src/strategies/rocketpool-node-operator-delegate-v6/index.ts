import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'rocket-pool';
export const version = '0.1.4';

const signerRegistryContractAddress = '0xc1062617d10Ae99E09D941b60746182A87eAB38F';
const signerRegistryAbi = [
  'function signerToNode(address) external view returns (address)'
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

  const req = await fetch(
    'https://api.rocketpool.net/mainnet/delegates/block/' + blockTag
  );
  const resp = await req.json();

  const signerRegistry = new Multicaller(
    network,
    provider,
    signerRegistryAbi,
    { blockTag }
  );

  addresses.forEach((address) => {
    signerRegistry.call(address, signerRegistryContractAddress, 'signerToNode', [address]);
  });

  const signerRegistryResponse: Record<string, string> =
    await signerRegistry.execute();

  const nodeData = addresses.map((address) => {
    const nodeAddress = getAddress(signerRegistryResponse[address]);
    const node = resp.find((obj) => getAddress(obj.address) === getAddress(nodeAddress));
    return {
      address: address,
      votingPower: node ? node.votingPower : 0
    };
  });

  const reduced: Record<string, number> = nodeData.reduce((acc, obj) => {
    const address = getAddress(obj.address);
    acc[address] = obj.votingPower;
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(reduced).map(([address, votePower]) => [
      address,
      parseFloat(String(votePower))
    ])
  );
}
