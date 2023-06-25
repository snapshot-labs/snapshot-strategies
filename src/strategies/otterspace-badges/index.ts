import { error } from 'console';
import { subgraphRequest } from '../../utils';

export const author = 'otterspace-xyz';
export const version = '1.0.1';

const OTTERSPACE_SUBGRAPH_API_URLS_BY_CHAIN_ID = {
  '1': 'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-mainnet',
  '5': 'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-goerli',
  '10': 'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-optimism-alpha',
  '420':
    'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-optimism-goerli',
  '137':
    'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-polygon',
  '11155111':
    'https://api.studio.thegraph.com/query/44988/badges-sepolia/version/latest'
};

function fetchBadgesForRaft(
  network: string,
  raftTokenId: string,
  specIds: string[],
  blockTag: number | string
): Promise<any> {
  const url = OTTERSPACE_SUBGRAPH_API_URLS_BY_CHAIN_ID[network];

  if (url == undefined) {
    throw new error(`Unsupported network with id: ${network}`);
  }

  const specFilter: any = {
    raft: `rafts:${raftTokenId}`
  };
  if (specIds && specIds.length > 0) {
    specFilter.id_in = specIds;
  }

  const query = {
    badges: {
      __args: {
        where: {
          spec_: specFilter
        },
        block: blockTag != 'latest' ? { number: blockTag } : null
      },
      owner: {
        id: true
      },
      spec: {
        id: true
      }
    }
  };

  return subgraphRequest(url, query);
}

function getBadgeWeight(specs: any[], badgeSpecID: string): number {
  let badgeWeight = 0;

  if (specs && specs.length > 0) {
    const specConfig = specs.find((spec: any) => spec.id === badgeSpecID);

    badgeWeight =
      specConfig &&
      isBadgeActive(specConfig.status, specConfig.metadata?.expiresAt || null)
        ? specConfig.weight
        : 0;
  } else {
    badgeWeight = 1;
  }

  return badgeWeight;
}

function isBadgeActive(status: string, expiresAt: string | null): boolean {
  return !['REVOKED', 'BURNED'].includes(status) && expiresAt
    ? Date.now() - Number(new Date(expiresAt)) <= 0
    : true;
}

function applyBadgeWeights(badges: [], options: any) {
  const badgeWeights = {};

  badges.forEach((badge: any) => {
    const badgeAddress = badge.owner.id.toLowerCase();

    const badgeWeight = getBadgeWeight(options.specs, badge.spec.id);

    // picks the highest weight when multiple badges are held by the same address
    if (
      !badgeWeights[badgeAddress] ||
      badgeWeight > badgeWeights[badgeAddress]
    ) {
      badgeWeights[badgeAddress] = badgeWeight;
    } else {
      return;
    }
  });

  return badgeWeights;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const getBadgesResponse = await fetchBadgesForRaft(
    network,
    options.raftTokenId,
    options.specs.map((spec) => spec.id),
    blockTag
  );

  let badgeWeights = {};
  const badges = getBadgesResponse?.badges;
  if (!badges) return badgeWeights;

  badgeWeights = applyBadgeWeights(badges, options);

  return Object.fromEntries(
    addresses.map((address: string) => [
      address,
      badgeWeights[address.toLowerCase()] || 0
    ])
  );
}
