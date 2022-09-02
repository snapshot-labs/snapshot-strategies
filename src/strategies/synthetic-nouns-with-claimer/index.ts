import { Multicaller } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'stephancill';
export const version = '0.1.0';

const abi = ['function ownerOf(uint256 index) external view returns (address)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Get the minter from zora api
  const mints = await fetch('https://api.zora.co/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{
          mints(where: {collectionAddresses: "${
            options.address
          }", minterAddresses: ${JSON.stringify(
        addresses
      )}}, pagination: {limit: 500}) {
            nodes {
              mint {
                tokenId,
                toAddress
              }
            }
          }
        }`
    })
  }).then((res) => res.json());

  const mintsByAddress = mints.data.mints.nodes.reduce((acc, node) => {
    const address = node.mint.toAddress;
    const tokenId = node.mint.tokenId;
    if (!acc[address]) {
      acc[address] = undefined;
    }
    acc[address] = tokenId;
    return acc;
  }, {});

  // Use multicall to check if the token is owned by the address
  const multicaller = new Multicaller(network, provider, abi, {
    blockTag
  });
  addresses.forEach((address) => {
    if (mintsByAddress[address]) {
      multicaller.call(address, options.address, 'ownerOf', [
        mintsByAddress[address]
      ]);
    }
  });

  const response = await multicaller.execute();

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      response[address] && response[address].toLowerCase() === address ? 1 : 0
    ])
  );
}
