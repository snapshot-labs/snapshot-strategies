import fetch from 'cross-fetch';
import { getScoresDirect, Multicaller, sha256 } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'rocket-pool';
export const version = '0.1.8';
export const dependOnOtherAddress = true;

const signerRegistryContractAddress =
  '0xc1062617d10Ae99E09D941b60746182A87eAB38F';
const signerRegistryAbi = [
  'function signerToNode(address) external view returns (address)'
];

const snapshotSecretHeader = sha256(
  `https://api.rocketpool.net/mainnet/delegates/block/${process.env.SNAPSHOT_API_STRATEGY_SALT}`
);

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const validPrefix = 'rocketpool-node-operator-v';
  if (
    !options.strategies.some((s) => {
      const parsedStrategy = JSON.parse(JSON.stringify(s));
      return parsedStrategy.name.startsWith(validPrefix);
    })
  ) {
    return {};
  }

  const req = await fetch(
    'https://api.rocketpool.net/mainnet/delegates/block/' + blockTag,
    {
      headers: {
        'X-Snapshot-API-Secret': snapshotSecretHeader
      }
    }
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

  const nodeAddressMap: Map<any, any> = new Map(
    resp.map((obj) => [getAddress(obj.address), obj])
  );

  const nodeData = addresses.map((address) => {
    const nodeAddress = getAddress(signerRegistryResponse[address]);
    const node = nodeAddressMap.get(nodeAddress);
    const signallingAddress = address;
    const delegatesTo =
      node && node.delegatesTo ? getAddress(node.delegatesTo) : '';
    const delegators =
      node && node.delegators.length > 0
        ? node.delegators.map((d) => getAddress(d.address))
        : [nodeAddress];
    return {
      signallingAddress: signallingAddress,
      nodeAddress: nodeAddress,
      delegatesTo: delegatesTo,
      delegators: delegators
    };
  });

  const nodeDataMap: Map<any, any> = new Map(
    nodeData.map((obj) => [getAddress(obj.nodeAddress), obj])
  );

  const overrides = nodeData
    .map((node) => {
      if (node.delegatesTo !== node.nodeAddress) {
        return {
          nodeAddress: node.nodeAddress,
          delegatesTo: node.delegatesTo
        };
      }
      return {};
    })
    .filter((override) => Object.keys(override).length !== 0);

  if (Object.keys(overrides).length !== 0) {
    overrides.map((override) => {
      const delegate = nodeDataMap.get(override.delegatesTo);
      if (!delegate) return;
      const delegators = delegate
        ? delegate.delegators.filter((d) => d !== override.nodeAddress)
        : [];
      delegate.delegators = delegators;
      nodeDataMap.set(override.delegatesTo, delegate);
      const nodeToUpdate = nodeData.find(
        (node) => node.nodeAddress === delegate.nodeAddress
      );
      nodeToUpdate.delegators = delegators;
    });
  }

  const delegations: Record<string, string[]> = Object.fromEntries(
    nodeData.map((node) => [node.nodeAddress, node.delegators])
  );

  if (Object.keys(delegations).length === 0) return {};

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

  const signallingAddressMap: Map<any, any> = new Map(
    nodeData.map((obj) => [getAddress(obj.signallingAddress), obj])
  );

  return Object.fromEntries(
    addresses.map((address) => {
      const data = signallingAddressMap.get(getAddress(address));
      if (!data) return [address, 0];
      const delegators = data.delegators;
      const addressScore = delegators.reduce(
        (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
        0
      );
      return [address, addressScore];
    })
  );
}
