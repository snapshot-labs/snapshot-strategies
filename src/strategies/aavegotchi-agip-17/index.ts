import { subgraphRequest } from '../../utils';

export const author = 'candoizo';
export const version = '0.1.0';

const AAVEGOTCHI_SUBGRAPH_URL = {
  137: 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic'
};

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const walletQueryParams = {
    users: {
      __args: {
        where: {
          id_in: addresses.map((addr: string) => addr.toLowerCase())
        },
        first: 1000
      },
      id: true,
      parcelsOwned: {
        size: true
      }
    }
  };
  const result = await subgraphRequest(AAVEGOTCHI_SUBGRAPH_URL[network], {
    ...walletQueryParams
  });

  // agip 17: Voting power of 0.5 GHST/pixel
  const realmSizeVotePower = {
    0: 32, // humble
    1: 128, // reasonable
    2: 1028, // spacious vertical
    3: 1028, // spacious horizontal
    4: 2048 // partner
  };

  const walletScores = {};
  result.users.map(({ id, parcelsOwned }) => {
    let realmVotingPowerValue = 0;
    if (parcelsOwned.length > 0) {
      parcelsOwned.map(({ size }) => {
        let votePower = realmSizeVotePower[size];
        if (isNaN(votePower)) votePower = 0;
        realmVotingPowerValue += votePower;
      });
    }

    const addr = addresses.find(
      (addrOption: string) => addrOption.toLowerCase() === id
    );
    walletScores[addr] = realmVotingPowerValue;
  });
  addresses.map((addr) => {
    if (!walletScores[addr]) walletScores[addr] = 0;
  });

  return walletScores;
}
