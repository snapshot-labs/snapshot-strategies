import { subgraphRequest } from '../../utils';
import examplesFile from './examples.json';

export const author = 'otterspace';
export const version = '1.0.0';
export const examples = examplesFile;

const OTTERSPACE_SUBGRAPH_API_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-optimism',
  '5': 'https://api.thegraph.com/subgraphs/name/otterspace-xyz/badges-goerli'
};

const params = {
  badges: {
    __args: {
      where: {
        spec_: {
          raft: ''
        }
      }
    },
    owner: true,
    spec: {
      id: true
    }
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  snapshot
) {
  // Get all the badges for a raft
  params.badges.__args.where.spec_.raft = `${options.raftAddress}:${options.raftTokenId}`;
  const getBadgesResponse = await subgraphRequest(
    OTTERSPACE_SUBGRAPH_API_URL[network],
    params
  );

  // If a badge's spec is listed in the options, set the associated weight
  const badgeWeights = {};
  if (getBadgesResponse && getBadgesResponse.badges) {
    getBadgesResponse.badges.forEach((badge: any) => {
      const badgeAddress = badge.owner.toLowerCase();

      // set the weight of a badge as 0
      let badgeWeight = badgeWeights[badgeAddress];
      if (!badgeWeight) {
        badgeWeight = 0;
      } else {
        return;
      }

      if (options.specs && options.specs.length > 0) {
        // for the specs defined in config, set the associated weight
        const specConfig = options.specs.find(
          (s: any) => s.id === badge.spec.id
        );
        badgeWeight = specConfig !== undefined ? specConfig.weight : 0;
      } else {
        // if there were no specs sepcified, all badges under the raft
        // are treated as equally weighted
        badgeWeight = 1;
      }
      badgeWeights[badgeAddress] = badgeWeight;
    });
  }

  // For all the addresses that vote with a badge, perform a lookup to fetch their associated weight
  return Object.fromEntries(
    addresses.map((address: any) => [
      address,
      badgeWeights[address.toLowerCase()] || 0
    ])
  );
}
