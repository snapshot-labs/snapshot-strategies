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

  const ownerResponse = await multicall(network, provider, abi, ownerCalls, {
    blockTag
  });

  const resp = await fetch(options.apiUrl);
  const tokenStatus = await resp.json();

  function checkActivated(address: any) {
    const index = ownerResponse.findIndex(
      (res: any) => res.owner.toLowerCase() === address.toLowerCase()
    );
    if (index == -1) {
      return 0;
    }
    if (tokenStatus[index].Active == true) {
      return 1;
    }
    return 0;
  }

  const votes = addresses.map((address: any) => checkActivated(address));

  const scores = {};
  votes.map((value, i) => {
    scores[addresses[i]] = value;
  });
  return scores;
}
