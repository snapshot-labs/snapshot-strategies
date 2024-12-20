// index.ts
import { multicall } from '../../utils';

export const author = 'kennyrowe';
export const version = '0.1.0';
export const name = 'urbitGalaxies';

const erc721ABI = [
  'function ownerOf(uint256 tokenId) external view returns (address owner)'
];

const votingProxyABI = [
  'function getVotingProxy(uint32 _point) external view returns (address)'
];

interface StrategyOptions {
  erc721Address: string; // ERC-721 Contract address for Urbit galaxies
  votingProxyAddress: string; // Voting Proxy contract address
  symbol: string; // Token symbol (optional, for UI purposes)
}

export async function strategy(
  space: string,
  network: string,
  provider: any,
  addresses: string[],
  options: StrategyOptions,
  snapshot: number | 'latest'
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const score = {} as Record<string, number>;

  type MulticallParam = [string, string, any[]];
  const ownerCalls: MulticallParam[] = [];
  const proxyCalls: MulticallParam[] = [];
  for (let tokenId = 0; tokenId <= 255; tokenId++) {
    ownerCalls.push([options.erc721Address, 'ownerOf', [tokenId]]);
    proxyCalls.push([options.votingProxyAddress, 'getVotingProxy', [tokenId]]);
  }

  const [ownerResponses, proxyResponses] = await Promise.all([
    multicall(network, provider, erc721ABI, ownerCalls, { blockTag }),
    multicall(network, provider, votingProxyABI, proxyCalls, { blockTag })
  ]);

  ownerResponses.forEach((value, index) => {
    const ownerAddress = value[0];
    const proxyAddress = proxyResponses[index][0];

    // Determine the effective voter (proxy or owner)
    const effectiveVoter =
      proxyAddress !== '0x0000000000000000000000000000000000000000'
        ? proxyAddress
        : ownerAddress;

    if (addresses.includes(effectiveVoter)) {
      score[effectiveVoter] = (score[effectiveVoter] || 0) + 1;
    }
  });

  return score;
}
