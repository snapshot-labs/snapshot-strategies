import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { subgraphRequest } from '../../utils';

export const author = 'candoizo';
export const version = '0.1.0';

const AAVEGOTCHI_SUBGRAPH_URL = {
  137: 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic'
};

const tokenAbi = [
  {
    inputs: [{ internalType: 'address', name: '_account', type: 'address' }],
    name: 'itemBalances',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'itemId', type: 'uint256' },
          { internalType: 'uint256', name: 'balance', type: 'uint256' }
        ],
        internalType: 'struct ItemsFacet.ItemIdIO[]',
        name: 'bals_',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const itemPriceParams = {
  itemTypes: {
    __args: {
      first: 1000
    },
    svgId: true,
    ghstPrice: true
  }
};

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, tokenAbi, { blockTag });
  addresses.map((addr: string) =>
    multi.call(
      `${options.tokenAddress}.${addr.toLowerCase()}`,
      options.tokenAddress,
      'itemBalances',
      [addr]
    )
  );
  // const multiRes = await multi.execute();

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
          .filter((itemId: number) => (itemId == 239 || itemId == 240 || itemId == 241 ))
          .map((itemId) => {
            let votes = itemVotingPower[itemId.toString()];
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
