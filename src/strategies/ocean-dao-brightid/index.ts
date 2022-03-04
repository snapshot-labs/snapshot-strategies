import {
  getProvider,
  getScoresDirect,
  multicall,
  subgraphRequest
} from '../../utils';
import { getDelegations } from '../../utils/delegation';

export const author = 'trizin';
export const version = '0.1.0';

const abi = [
  'function isVerifiedUser(address _user) external view returns (bool)'
];

/* Code from multichain strategy */

async function getBlocks(snapshot, provider, options, network) {
  const blocks = {};
  Object.keys(options.strategies).forEach((s) => (blocks[s] = 'latest'));
  const block = await provider.getBlock(snapshot);
  const query = {
    blocks: {
      __args: {
        where: {
          ts: block.timestamp,
          network_in: Object.keys(blocks)
        }
      },
      network: true,
      number: true
    }
  };
  const url = 'https://blockfinder.snapshot.org/graphql';
  const data = await subgraphRequest(url, query);
  data.blocks.forEach((block) => (blocks[block.network] = block.number));
  data.blocks[network] = snapshot;
  return blocks;
}

////////////////////////////////////////////////////////////////////////////////

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const chainBlocks = await getBlocks(snapshot, provider, options, network);
  const delegations = await getDelegations(space, network, addresses, snapshot);

  const brightIdNetwork = options.brightIdNetwork || network;
  const response = await multicall(
    brightIdNetwork,
    getProvider(brightIdNetwork),
    abi,
    addresses.map((address: any) => [
      options.registry,
      'isVerifiedUser',
      [address]
    ]),
    { blockTag: chainBlocks[brightIdNetwork] }
  );

  const totalScores = {};

  for (const chain of Object.keys(options.strategies)) {
    let scores = await getScoresDirect(
      space,
      options.strategies[chain],
      chain,
      getProvider(chain),
      addresses,
      chainBlocks[chain]
    );

    // [{ address: '0x...', score: 0.5 },{ address: '0x...', score: 0.5 }]
    // sum scores for each address and return
    scores = scores.reduce((finalScores: any, score: any) => {
      for (const [address, value] of Object.entries(score)) {
        if (!finalScores[address]) {
          finalScores[address] = 0;
        }
        finalScores[address] += value;
      }
      return finalScores;
    }, {});
    // { address: '0x...55', score: 1.0 }

    // sum delegations
    addresses.forEach((address) => {
      if (delegations[address]) {
        delegations[address].forEach((delegator) => {
          // @ts-ignore
          scores[address] += scores[delegator];
          scores[delegator] = 0;
        });
      }
    });

    for (const key of Object.keys(scores)) {
      totalScores[key] = totalScores[key]
        ? totalScores[key] + scores[key]
        : scores[key];
    }
  }

  return Object.fromEntries(
    addresses.map((address, index) => {
      let addressScore = totalScores[address];
      addressScore *= response[index][0]
        ? options.brightIdMultiplier // brightId multiplier
        : options.notVerifiedMultiplier; // not verified multiplier
      if (isNaN(addressScore)) addressScore = 0;
      return [address, addressScore];
    })
  );
}
