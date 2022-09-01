import { error } from 'console';
import { subgraphRequest } from '../../utils';

export const author = 'otterspace';
export const version = '1.0.0';

const OTTERSPACE_SUBGRAPH_API_URLS_BY_CHAIN_ID = {
  '5': 'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-goerli'
};

function fetchBadgesForRaft(
  network: string,
  raftAddress: string,
  raftTokenId: string
): Promise<any> {
  const url = OTTERSPACE_SUBGRAPH_API_URLS_BY_CHAIN_ID[network];

  if (url == undefined) {
    throw new error(`Unsupported network with id: ${network}`);
  }

  const query = {
    badges: {
      __args: {
        where: {
          spec_: {
            raft: `rafts:${raftAddress}:${raftTokenId}`
          }
        }
      },
      owner: true,
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
    badgeWeight = specConfig ? specConfig.weight : 0;
  } else {
    badgeWeight = 1;
  }

  return badgeWeight;
}

function applyBadgeWeights(badges: [], options: any) {
  let badgeWeights = {};

  badges.forEach((badge: any) => {
    const badgeAddress = badge.owner.toLowerCase();

    if (badgeWeights[badgeAddress]) return;

    badgeWeights[badgeAddress] = getBadgeWeight(options.specs, badge.spec.id);
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
  const getBadgesResponse = await fetchBadgesForRaft(
    network,
    options.raftAddress,
    options.raftTokenId
  );

  let badgeWeights = {};
  let badges = getBadgesResponse?.badges;
  if (!badges) return badgeWeights;

  badgeWeights = applyBadgeWeights(badges, options);

  return Object.fromEntries(
    addresses.map((address: string) => [
      address,
      badgeWeights[address.toLowerCase()] || 0
    ])
  );
}
