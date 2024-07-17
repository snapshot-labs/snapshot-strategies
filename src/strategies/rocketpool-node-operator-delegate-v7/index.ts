import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';
import { getScoresDirect, Multicaller } from '../../utils';

export const author = 'rocket-pool';
export const version = '0.1.7';

const signerRegistryContractAddress =
  '0xc1062617d10Ae99E09D941b60746182A87eAB38F';
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
  const blockTag =
    typeof snapshot === 'number' ? snapshot : await provider.getBlockNumber();

  const req = await fetch(
    'https://api.rocketpool.net/mainnet/delegates/block/' + blockTag
  );
  const resp = await req.json();

  const signerRegistry = new Multicaller(network, provider, signerRegistryAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    signerRegistry.call(
      address,
      signerRegistryContractAddress,
      'signerToNode',
      [address]
    );
  });

  const signerRegistryResponse: Record<string, string> =
    await signerRegistry.execute();

  const addressMap: Map<any, any> = new Map(resp.map(obj => [getAddress(obj.address), obj]));

  const nodeData = addresses.map((address) => {
    const nodeAddress = getAddress(signerRegistryResponse[address]);
    const node = addressMap.get(nodeAddress);
    return {
      signallingAddress: address,
      nodeAddress: nodeAddress,
      delegators: node && node.delegators.length > 0 ? node.delegators.map((d) => getAddress(d.address)) : [nodeAddress],
    }
  });

  const delegations: Record<string, string[]> = Object.fromEntries(
    nodeData.map((node) => [node.nodeAddress, node.delegators])
  );

  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      Object.values(delegations).reduce((a: string[], b: string[]) =>
        a.concat(b)
      ),
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressData = nodeData.find((node) => node.signallingAddress === address);
      if (addressData.nodeAddress === "0x0000000000000000000000000000000000000000") {
        return [address, 0];
      }
      const delegators = addressData.delegators;
      const addressScore = delegators.reduce(
        (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
        0
      );
      return [address, addressScore];
    })
  );
}
