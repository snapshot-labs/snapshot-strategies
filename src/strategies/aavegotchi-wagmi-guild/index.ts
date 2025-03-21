import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'programmablewealth';
export const version = '0.1.0';

const AAVEGOTCHI_SUBGRAPH_URL = {
  137: 'https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/aavegotchi-core-matic/api'
};

const itemPriceParams = {
  itemTypes: {
    __args: {
      first: 1000
    },
    svgId: true,
    ghstPrice: true
  }
};

export async function strategy(_space, network, provider, addresses) {
  const walletQueryParams = {
    users: {
      __args: {
        where: {
          id_in: addresses.map((addr: string) => addr.toLowerCase())
        },
        first: 1000
      },
      id: true,
      gotchisOwned: {
        baseRarityScore: true,
        equippedWearables: true
      }
    }
  };
  const result = await subgraphRequest(AAVEGOTCHI_SUBGRAPH_URL[network], {
    ...itemPriceParams,
    ...walletQueryParams
  });
  const prices = {};
  result.itemTypes.map((itemInfo) => {
    const itemValue = parseFloat(formatUnits(itemInfo.ghstPrice, 18));
    if (itemValue > 0) prices[parseInt(itemInfo.svgId)] = itemValue;
  });

  const itemVotingPower = { '239': 100, '240': 100, '241': 100 };

  const walletScores = {};
  result.users.map((addrInfo) => {
    let gotchiWagieValue = 0;

    const { id, gotchisOwned } = addrInfo;

    if (gotchisOwned.length > 0)
      gotchisOwned.map((gotchi) => {
        gotchi.equippedWearables
          .filter(
            (itemId: number) => itemId == 239 || itemId == 240 || itemId == 241
          )
          .map((itemId) => {
            const votes = itemVotingPower[itemId.toString()];
            gotchiWagieValue += votes;
          });
      });

    const addr = addresses.find(
      (addrOption: string) => addrOption.toLowerCase() === id
    );
    walletScores[addr] = gotchiWagieValue;
  });
  addresses.map((addr) => {
    if (!walletScores[addr]) walletScores[addr] = 0;
  });

  return walletScores;
}
