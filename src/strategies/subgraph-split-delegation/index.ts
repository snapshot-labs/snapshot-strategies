import { getAddress } from '@ethersproject/address';
import { subgraphRequest, getScoresDirect } from '../../utils';
import { Strategy } from '@snapshot-labs/snapshot.js/dist/src/voting/types';
import { Snapshot } from '../../types';

export const author = 'aragon';
export const version = '0.1.0';

const DEFAULT_BACKEND_URL =
  'https://api.studio.thegraph.com/query/87073/split-delegation/version/latest';

type Params = {
  subgraphUrl: string;
  strategies: Strategy[];
};

type Delegation = {
  delegator?: Member;
  delegatee?: Member;
  ratio: number;
};

type Member = {
  id?: string;
  address: string;
  delegators?: Delegation[];
  delegatees?: Delegation[];
};

export async function strategy(
  space: string,
  network: string,
  provider: any,
  addresses: string[],
  options: Params = {
    subgraphUrl: DEFAULT_BACKEND_URL,
    strategies: []
  },
  snapshot: Snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);

  const members = await getDelegations(
    options.subgraphUrl,
    addresses,
    space,
    block
  );

  addresses = addresses.map(getAddress);

  const allAddresses = new Set(addresses);

  members.forEach((member) => {
    allAddresses.add(member.address);
    member.delegators?.forEach((delegation) =>
      delegation.delegator
        ? allAddresses.add(delegation.delegator.address)
        : null
    );
    member.delegatees?.forEach((delegation) =>
      delegation.delegatee
        ? allAddresses.add(delegation.delegatee.address)
        : null
    );
  });

  const scores: { [k: string]: unknown }[] = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      [...allAddresses],
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    addresses.map((address) => {
      const member = members.find(
        (member) => member.address.toLowerCase() === address.toLowerCase()
      );
      return [
        getAddress(address),
        member ? getVp(member, scores) : getAddressScore(scores, address)
      ];
    })
  );
}

const getAddressScore = (
  scores: { [k: string]: any }[],
  address?: string
): any => {
  if (!address) return 0;
  return scores.reduce((total, score) => total + (score[address] ?? 0), 0);
};

const getVp = (member: Member, scores: { [k: string]: any }[]): any => {
  const addressScore = getAddressScore(scores, member.address);
  const delegatedVp =
    member.delegatees?.reduce((total, delegation) => {
      const vp = addressScore;
      return total + delegation.ratio * vp;
    }, 0) ?? 0;
  const receivedVp =
    member.delegators?.reduce((total, delegation) => {
      const vp = getAddressScore(scores, delegation.delegator?.address);
      return total + delegation.ratio * vp;
    }, 0) ?? 0;

  return addressScore + receivedVp - delegatedVp;
};

async function getDelegations(
  subgraphURL: string,
  addresses: string[],
  space: string,
  block: any
): Promise<Member[]> {
  const chunkSize = 25;
  const pageSize = 20; // chunkSize * pageSize * 2 <= 1000 (max elements per query)

  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += chunkSize) {
    chunks.push(addresses.slice(i, i + chunkSize));
  }

  const results: Member[] = [];
  for (const chunk of chunks) {
    let page = 0;
    let reqAddresses = chunk.map((address) => address.toLowerCase());
    while (reqAddresses.length) {
      const params = {
        members: {
          __args: {
            block: { number: block.number },
            where: {
              address_in: reqAddresses
            }
          },
          id: true,
          address: true,
          delegators: {
            __args: {
              where: {
                context: space,
                expirationTimestamp_gte: block.timestamp
              },
              first: pageSize,
              skip: page * pageSize
            },
            delegator: {
              address: true
            },
            ratio: true
          },
          delegatees: {
            __args: {
              where: {
                context: space,
                expirationTimestamp_gte: block.timestamp
              },
              first: pageSize,
              skip: page * pageSize
            },
            delegatee: {
              address: true
            },
            ratio: true
          }
        }
      };
      const result: { members: Member[] } = await subgraphRequest(
        subgraphURL,
        params
      );
      result.members.forEach((newMember) => {
        const existingMemberIndex = results.findIndex(
          (member) =>
            member.address.toLowerCase() === newMember.address.toLowerCase()
        );
        if (existingMemberIndex !== -1) {
          const existingMember = results[existingMemberIndex];
          existingMember.delegatees = [
            ...(existingMember.delegatees || []),
            ...(newMember.delegatees || [])
          ];
          existingMember.delegators = [
            ...(existingMember.delegators || []),
            ...(newMember.delegators || [])
          ];
        } else {
          results.push(newMember);
        }
      });
      reqAddresses = result.members
        .filter(
          (member) =>
            member.delegatees?.length === pageSize ||
            member.delegators?.length === pageSize
        )
        .map((member) => member.address);
      page++;
    }
  }

  return results;
}
