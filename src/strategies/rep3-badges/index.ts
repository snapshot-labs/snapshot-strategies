import { error } from 'console';
import { subgraphRequest } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'rep3-gg';
export const version = '1.0.0';

const REP3_SUBGRAPH_API_URLS_BY_CHAIN_ID = {
  '80001': 'https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-mumbai',
  '137': 'https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-matic'
};

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

// subgraph helper function to get Membership Badges
function fetchMembershipsForAddress(
  network: string,
  contractAddress: string,
  claimer: string,
  blockTag: number | string
): Promise<any> {
  const url = REP3_SUBGRAPH_API_URLS_BY_CHAIN_ID[network];

  if (url == undefined) {
    throw new error(`Unsupported network with id: ${network}`);
  }

  const query = {
    membershipNFTs: {
      __args: {
        where: {
          contractAddress: contractAddress,
          claimer: claimer
        },
        block: blockTag != 'latest' ? { number: blockTag } : null
      },
      time: true,
      level: true,
      tokenID: true,
      claimer: true
    }
  };

  return subgraphRequest(url, query);
}

// subgraph helper function to get Association Badges

function fetchAssociationBadgesForAddress(
  network: string,
  contractAddress: string,
  claimer: string,
  blockTag: number | string
): Promise<any> {
  const url = REP3_SUBGRAPH_API_URLS_BY_CHAIN_ID[network];

  if (url == undefined) {
    throw new error(`Unsupported network with id: ${network}`);
  }

  const query = {
    associationBadges: {
      __args: {
        where: {
          contractAddress: contractAddress,
          claimer: claimer
        },
        block: blockTag != 'latest' ? { number: blockTag } : null
      },
      type: true,
      tokenID: true,
      claimer: true
    }
  };

  return subgraphRequest(url, query);
}

// Combining ERC20 Balances and Weights from Rep3 Badges

function applyBadgeWeights(badges: any[], erc20Balance: any, options: any) {
  const badgeWeights = {};
  badges.forEach((badge: any) => {
    if (badge?.level) {
      const levelWeight = options.specs.find(
        (spec) => spec.level === parseInt(badge?.level)
      );
      if (badgeWeights[getAddress(badge.claimer)]) {
        badgeWeights[getAddress(badge.claimer)] =
          badgeWeights[getAddress(badge.claimer)] + levelWeight.weight;
      } else {
        badgeWeights[getAddress(badge.claimer)] = levelWeight.weight;
      }
    } else if (badge?.type) {
      const levelWeight = options.specs.find(
        (spec) => spec.type === parseInt(badge?.type)
      );
      if (badgeWeights[getAddress(badge.claimer)]) {
        badgeWeights[getAddress(badge.claimer)] =
          badgeWeights[getAddress(badge.claimer)] + levelWeight.weight;
      } else {
        badgeWeights[getAddress(badge.claimer)] = levelWeight.weight;
      }
    }
  });
  if (options?.erc20Token) {
    Object.keys(erc20Balance).forEach((key) => {
      if (badgeWeights[key]) {
        if (erc20Balance[key]) {
          erc20Balance[key] = erc20Balance[key] * badgeWeights[key];
        } else {
          erc20Balance[key] = badgeWeights[key];
        }
      }
    });
  }

  return options?.erc20Token ? erc20Balance : badgeWeights;
}

// helper function to get ERC20 balances for addresses
async function getErc20Balance(
  network,
  provider,
  abi,
  blockTag,
  addresses,
  options
): Promise<any> {
  if (options.erc20Token) {
    const multi = new Multicaller(network, provider, abi, { blockTag });
    addresses.forEach((address) =>
      multi.call(address, options.erc20Token, 'balanceOf', [address])
    );
    try {
      const result: any = await multi.execute();
      Object.keys(result).forEach((key) => {
        result[key] = parseFloat(
          formatUnits(result[key], options.erc20Decimal)
        );
      });

      return result;
    } catch (error: any) {
      return {};
    }
  } else {
    return {};
  }
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

  const erc20BalanceOf: any = await getErc20Balance(
    network,
    provider,
    abi,
    blockTag,
    addresses,
    options
  );

  let associationBadges: any[] = [];
  const validMembershipNft: any[] = await Promise.all(
    addresses.map(async (address: string) => {
      const allMembershipbadges = await fetchMembershipsForAddress(
        options.subgraphNetwork,
        options.rep3ContractAddress,
        address,
        'latest'
      );
      const allAssociationBadges = await fetchAssociationBadgesForAddress(
        options.subgraphNetwork,
        options.rep3ContractAddress,
        address,
        'latest'
      );
      if (allAssociationBadges.associationBadges.length) {
        associationBadges = associationBadges.concat(
          allAssociationBadges.associationBadges
        );
      }
      if (allMembershipbadges.membershipNFTs.length) {
        const latestMembership = allMembershipbadges.membershipNFTs.sort(
          (p1, p2) => (p1.time < p2.time ? 1 : p1.time > p2.time ? -1 : 0)
        );
        return latestMembership[0];
      }
    })
  );

  let allWeightableBadges = validMembershipNft.concat(associationBadges);
  allWeightableBadges = allWeightableBadges.filter((x) => x !== undefined);
  let badgeWeights = {};
  if (!allWeightableBadges) return badgeWeights;

  badgeWeights = applyBadgeWeights(
    allWeightableBadges,
    erc20BalanceOf,
    options
  );

  return Object.fromEntries(
    addresses.map((address: string) => [address, badgeWeights[address] || 0])
  );
}
