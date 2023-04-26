import { multicall, getProvider } from '../../utils';
import { strategy as erc721Strategy } from '../erc721';
import { getSnapshots } from '../../utils';

export const author = 'darrylhansen';
export const version = '0.1.0';

const erc1155Abi = [
  'function balanceOf(address account, uint256 id) view returns (uint256)'
];

async function getERC1155Balances(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    erc1155Abi,
    addresses.flatMap((address: any) =>
      options.tokenIds.map((tokenId: any) => [
        options.address,
        'balanceOf',
        [address, tokenId]
      ])
    ),
    { blockTag }
  );

  const scores = addresses.reduce((acc, address, index) => {
    acc[address] = options.tokenIds.reduce((balance, _, tokenIdIndex) => {
      const value = response[index * options.tokenIds.length + tokenIdIndex];
      return balance + parseInt(value.toString(), 10);
    }, 0);
    return acc;
  }, {});

  return scores;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    options.networks.map((n) => n.networkId || network)
  );

  const erc721Options = {
    address: options.erc721KeyAddress
  };

  const erc721Keyholders = await erc721Strategy(
    space,
    '1', // Ethereum Mainnet for ERC721
    getProvider('1'),
    addresses,
    erc721Options,
    blocks['1']
  );

  const eligibleAddresses = Object.keys(erc721Keyholders).filter(
    (address) => erc721Keyholders[address] > 0
  );

  const results = await Promise.all(
    options.networks.map(({ networkId, erc1155Address }) =>
      getERC1155Balances(
        networkId,
        getProvider(networkId),
        eligibleAddresses,
        { ...options, address: erc1155Address },
        blocks[networkId]
      )
    )
  );

  return results.reduce((finalResults: any, networkResult: any) => {
    for (const [address, value] of Object.entries(networkResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }
      finalResults[address] += value;
    }
    return finalResults;
  }, {});
}
