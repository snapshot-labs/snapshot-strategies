import { multicall } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'peters-josh';
export const version = '0.1.0';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)',
  'function tokenURI(uint256 tokenId) public view returns (string uri)'
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

  const uriCalls: any[] = [];
  for (let i = options.startingTokenId; i <= options.endingTokenId; i++) {
    uriCalls.push([options.address, 'tokenURI', [i]]);
  }

  const ownerCalls: any[] = [];
  for (let i = options.startingTokenId; i <= options.endingTokenId; i++) {
    ownerCalls.push([options.address, 'ownerOf', [i]]);
  }

  const uriResponse = await multicall(network, provider, abi, uriCalls, {
    blockTag
  });

  const ownerResponse = await multicall(network, provider, abi, ownerCalls, {
    blockTag
  });

  async function checkActivated(address) {
    const index = ownerResponse.findIndex(
      (res: any) => res.owner.toLowerCase() === address.toLowerCase()
    );
    if (index == -1) {
      return 0;
    }

    const uri = uriResponse[index][0];
    let ipfs = uri.split('/');
    ipfs = ipfs[ipfs.length - 1];
    const resp = await fetch(`https://${options.gateway}/ipfs/${ipfs}`);
    const metadata = await resp.json();
    const activated = metadata.attributes[2];
    if (activated.trait_type === 'Activated' && activated.value === 'True') {
      return 1;
    }
    return 0;
  }

  const results = addresses.map(async (address: any) =>
    checkActivated(address)
  );
  const votes = await Promise.all(results);

  const scores = {};
  votes.map((value, i) => {
    scores[addresses[i]] = value;
  });
  return scores;
}
