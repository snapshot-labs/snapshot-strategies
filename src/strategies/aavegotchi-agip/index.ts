import { Multicaller } from '../../utils';
import { subgraphRequest } from '../../utils';
export const author = 'candoizo';
export const version = '0.2.5';

interface Prices {
  [id: string]: 0 | 5 | 10 | 20 | 50 | 100 | 300 | 2000 | 3000 | 10000;
}

const AAVEGOTCHI_SUBGRAPH_URL = {
  137: 'https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/aavegotchi-core-matic/api'
};

enum GotchiRarityPrices {
  None = 0,
  Common = 5,
  Uncommon = 10,
  Rare = 100,
  Legendary = 300,
  Mythical = 2000,
  Godlike = 10000
}

const prices: Prices = {
  '0': GotchiRarityPrices.None,
  '1': GotchiRarityPrices.Common,
  '2': GotchiRarityPrices.Common,
  '3': GotchiRarityPrices.Common,
  '4': GotchiRarityPrices.Uncommon,
  '5': GotchiRarityPrices.Uncommon,
  '6': GotchiRarityPrices.Uncommon,
  '7': GotchiRarityPrices.Rare,
  '8': GotchiRarityPrices.Rare,
  '9': GotchiRarityPrices.Rare,
  '10': GotchiRarityPrices.Legendary,
  '11': GotchiRarityPrices.Legendary,
  '12': GotchiRarityPrices.Legendary,
  '13': GotchiRarityPrices.Mythical,
  '14': GotchiRarityPrices.Mythical,
  '15': GotchiRarityPrices.Mythical,
  '16': GotchiRarityPrices.Godlike,
  '17': GotchiRarityPrices.Godlike,
  '18': GotchiRarityPrices.Common,
  '19': GotchiRarityPrices.Common,
  '20': GotchiRarityPrices.Common,
  '21': GotchiRarityPrices.Uncommon,
  '22': GotchiRarityPrices.Uncommon,
  '23': GotchiRarityPrices.Uncommon,
  '24': GotchiRarityPrices.Rare,
  '25': GotchiRarityPrices.Rare,
  '26': GotchiRarityPrices.Rare,
  '27': GotchiRarityPrices.Legendary,
  '28': GotchiRarityPrices.Legendary,
  '29': GotchiRarityPrices.Legendary,
  '30': GotchiRarityPrices.Mythical,
  '31': GotchiRarityPrices.Mythical,
  '32': GotchiRarityPrices.Mythical,
  '33': GotchiRarityPrices.Godlike,
  '34': GotchiRarityPrices.Godlike,
  '35': GotchiRarityPrices.Godlike,
  '36': GotchiRarityPrices.Common,
  '37': GotchiRarityPrices.Common,
  '38': GotchiRarityPrices.Common,
  '39': GotchiRarityPrices.Uncommon,
  '40': GotchiRarityPrices.Uncommon,
  '41': GotchiRarityPrices.Uncommon,
  '42': GotchiRarityPrices.Rare,
  '43': GotchiRarityPrices.Rare,
  '44': GotchiRarityPrices.Rare,
  '45': GotchiRarityPrices.Legendary,
  '46': GotchiRarityPrices.Legendary,
  '47': GotchiRarityPrices.Legendary,
  '48': GotchiRarityPrices.Mythical,
  '49': GotchiRarityPrices.Mythical,
  '50': GotchiRarityPrices.Mythical,
  '51': GotchiRarityPrices.Mythical,
  '52': GotchiRarityPrices.Godlike,
  '53': GotchiRarityPrices.Godlike,
  '54': GotchiRarityPrices.Godlike,
  '55': GotchiRarityPrices.Rare,
  '56': GotchiRarityPrices.Rare,
  '57': GotchiRarityPrices.Rare,
  '58': GotchiRarityPrices.Rare,
  '59': GotchiRarityPrices.Rare,
  '60': GotchiRarityPrices.Common,
  '61': GotchiRarityPrices.Legendary,
  '62': GotchiRarityPrices.Mythical,
  '63': GotchiRarityPrices.Godlike,
  '64': GotchiRarityPrices.Common,
  '65': GotchiRarityPrices.Legendary,
  '66': GotchiRarityPrices.Common,
  '67': GotchiRarityPrices.Common,
  '68': GotchiRarityPrices.Common,
  '69': GotchiRarityPrices.Common,
  '70': GotchiRarityPrices.Mythical,
  '71': GotchiRarityPrices.Rare,
  '72': GotchiRarityPrices.Mythical,
  '73': GotchiRarityPrices.Mythical,
  '74': GotchiRarityPrices.Mythical,
  '75': GotchiRarityPrices.Mythical,
  '76': GotchiRarityPrices.Common,
  '77': GotchiRarityPrices.Uncommon,
  '78': GotchiRarityPrices.Uncommon,
  '79': GotchiRarityPrices.Rare,
  '80': GotchiRarityPrices.Rare,
  '81': GotchiRarityPrices.Rare,
  '82': GotchiRarityPrices.Legendary,
  '83': GotchiRarityPrices.Rare,
  '84': GotchiRarityPrices.Legendary,
  '85': GotchiRarityPrices.Legendary,
  '86': GotchiRarityPrices.Mythical,
  '87': GotchiRarityPrices.Uncommon,
  '88': GotchiRarityPrices.Uncommon,
  '89': GotchiRarityPrices.Rare,
  '90': GotchiRarityPrices.Common,
  '91': GotchiRarityPrices.Uncommon,
  '92': GotchiRarityPrices.Rare,
  '93': GotchiRarityPrices.Legendary,
  '94': GotchiRarityPrices.Uncommon,
  '95': GotchiRarityPrices.Uncommon,
  '96': GotchiRarityPrices.Uncommon,
  '97': GotchiRarityPrices.Legendary,
  '98': GotchiRarityPrices.Legendary,
  '99': GotchiRarityPrices.Mythical,
  '100': GotchiRarityPrices.Legendary,
  '101': GotchiRarityPrices.Legendary,
  '102': GotchiRarityPrices.Legendary,
  '103': GotchiRarityPrices.Mythical,
  '104': GotchiRarityPrices.Legendary,
  '105': GotchiRarityPrices.Legendary,
  '106': GotchiRarityPrices.Legendary,
  '107': GotchiRarityPrices.Godlike,
  '108': GotchiRarityPrices.Uncommon,
  '109': GotchiRarityPrices.Uncommon,
  '110': GotchiRarityPrices.Rare,
  '111': GotchiRarityPrices.Legendary,
  '112': GotchiRarityPrices.Legendary,
  '113': GotchiRarityPrices.Godlike,
  '114': GotchiRarityPrices.Mythical,
  '115': GotchiRarityPrices.Legendary,
  '116': GotchiRarityPrices.Rare,
  '117': GotchiRarityPrices.Common,
  '118': GotchiRarityPrices.Legendary,
  '119': GotchiRarityPrices.Legendary,
  '120': GotchiRarityPrices.Legendary,
  '121': GotchiRarityPrices.Rare,
  '122': GotchiRarityPrices.Mythical,
  '123': GotchiRarityPrices.Uncommon,
  '124': GotchiRarityPrices.Mythical,
  '125': GotchiRarityPrices.Legendary,
  '126': GotchiRarityPrices.Common,
  '127': 20,
  '128': 20,
  '129': 50,
  '130': GotchiRarityPrices.Common,
  '131': GotchiRarityPrices.Uncommon,
  '132': GotchiRarityPrices.Rare,
  '133': GotchiRarityPrices.Legendary,
  '134': GotchiRarityPrices.Common,
  '135': GotchiRarityPrices.Uncommon,
  '136': GotchiRarityPrices.Rare,
  '137': GotchiRarityPrices.Common,
  '138': GotchiRarityPrices.Uncommon,
  '139': GotchiRarityPrices.Rare,
  '140': GotchiRarityPrices.Common,
  '141': GotchiRarityPrices.Uncommon,
  '142': GotchiRarityPrices.Rare,
  '143': GotchiRarityPrices.Legendary,
  '144': GotchiRarityPrices.Mythical,
  '145': GotchiRarityPrices.Godlike,
  '146': GotchiRarityPrices.Common,
  '147': GotchiRarityPrices.Uncommon,
  '148': GotchiRarityPrices.Rare,
  '149': GotchiRarityPrices.Legendary,
  '150': GotchiRarityPrices.Mythical,
  '151': GotchiRarityPrices.Common,
  '152': GotchiRarityPrices.Uncommon,
  '153': GotchiRarityPrices.Rare,
  '154': GotchiRarityPrices.Legendary,
  '155': GotchiRarityPrices.Mythical,
  '156': GotchiRarityPrices.Godlike,
  '157': GotchiRarityPrices.Uncommon,
  '158': GotchiRarityPrices.Rare,
  '159': GotchiRarityPrices.Legendary,
  '160': GotchiRarityPrices.Mythical,
  '161': GotchiRarityPrices.Godlike,
  '162': GotchiRarityPrices.Common,
  '163': GotchiRarityPrices.None,
  '164': GotchiRarityPrices.None,
  '165': GotchiRarityPrices.None,
  '166': GotchiRarityPrices.None,
  '167': GotchiRarityPrices.None,
  '168': GotchiRarityPrices.None,
  '169': GotchiRarityPrices.None,
  '170': GotchiRarityPrices.None,
  '171': GotchiRarityPrices.None,
  '172': GotchiRarityPrices.None,
  '173': GotchiRarityPrices.None,
  '174': GotchiRarityPrices.None,
  '175': GotchiRarityPrices.None,
  '176': GotchiRarityPrices.None,
  '177': GotchiRarityPrices.None,
  '178': GotchiRarityPrices.None,
  '179': GotchiRarityPrices.None,
  '180': GotchiRarityPrices.None,
  '181': GotchiRarityPrices.None,
  '182': GotchiRarityPrices.None,
  '183': GotchiRarityPrices.None,
  '184': GotchiRarityPrices.None,
  '185': GotchiRarityPrices.None,
  '186': GotchiRarityPrices.None,
  '187': GotchiRarityPrices.None,
  '188': GotchiRarityPrices.None,
  '189': GotchiRarityPrices.None,
  '190': GotchiRarityPrices.None,
  '191': GotchiRarityPrices.None,
  '192': GotchiRarityPrices.None,
  '193': GotchiRarityPrices.None,
  '194': GotchiRarityPrices.None,
  '195': GotchiRarityPrices.None,
  '196': GotchiRarityPrices.None,
  '197': GotchiRarityPrices.None,
  '198': GotchiRarityPrices.None,
  '199': GotchiRarityPrices.Rare,
  '200': GotchiRarityPrices.Uncommon,
  '201': GotchiRarityPrices.Legendary,
  '202': GotchiRarityPrices.Mythical,
  '203': GotchiRarityPrices.Rare,
  '204': GotchiRarityPrices.Uncommon,
  '205': GotchiRarityPrices.Common,
  '206': GotchiRarityPrices.Rare,
  '207': GotchiRarityPrices.Uncommon,
  '208': GotchiRarityPrices.Uncommon,
  '209': GotchiRarityPrices.Legendary,
  '210': GotchiRarityPrices.Common,
  '211': GotchiRarityPrices.Common,
  '212': 3000,
  '213': GotchiRarityPrices.Legendary,
  '214': GotchiRarityPrices.Godlike,
  '215': GotchiRarityPrices.Legendary,
  '216': 3000,
  '217': 3000,
  '218': GotchiRarityPrices.Uncommon,
  '219': GotchiRarityPrices.Rare,
  '220': GotchiRarityPrices.Legendary,
  '221': GotchiRarityPrices.Common,
  '222': GotchiRarityPrices.Uncommon,
  '223': GotchiRarityPrices.Uncommon,
  '224': GotchiRarityPrices.Rare,
  '225': GotchiRarityPrices.Common,
  '226': GotchiRarityPrices.Rare,
  '227': GotchiRarityPrices.Rare,
  '228': GotchiRarityPrices.Common,
  '229': GotchiRarityPrices.Uncommon,
  '230': GotchiRarityPrices.Common,
  '231': GotchiRarityPrices.Uncommon,
  '232': GotchiRarityPrices.Common,
  '233': GotchiRarityPrices.Uncommon,
  '234': 3000,
  '235': GotchiRarityPrices.Legendary,
  '236': GotchiRarityPrices.Rare,
  '237': 3000,
  '238': GotchiRarityPrices.Godlike,
  '239': GotchiRarityPrices.Uncommon,
  '240': GotchiRarityPrices.Uncommon,
  '241': GotchiRarityPrices.Rare,
  '242': GotchiRarityPrices.Legendary,
  '243': GotchiRarityPrices.Rare,
  '244': GotchiRarityPrices.Rare,
  '245': GotchiRarityPrices.Rare,
  '246': GotchiRarityPrices.Uncommon,
  '247': GotchiRarityPrices.Uncommon,
  '248': GotchiRarityPrices.Uncommon,
  '249': GotchiRarityPrices.Rare,
  '250': GotchiRarityPrices.Rare,
  '251': GotchiRarityPrices.Rare,
  '252': GotchiRarityPrices.Common,
  '253': GotchiRarityPrices.Common,
  '254': GotchiRarityPrices.Common,
  '255': GotchiRarityPrices.Legendary,
  '256': GotchiRarityPrices.Legendary,
  '257': GotchiRarityPrices.Legendary,
  '258': GotchiRarityPrices.Godlike,
  '259': GotchiRarityPrices.Godlike,
  '260': GotchiRarityPrices.Godlike,
  '261': GotchiRarityPrices.Mythical,
  '262': GotchiRarityPrices.Mythical,
  '263': GotchiRarityPrices.Mythical,
  '264': GotchiRarityPrices.None,
  '265': GotchiRarityPrices.None,
  '266': GotchiRarityPrices.None,
  '267': GotchiRarityPrices.None,
  '268': GotchiRarityPrices.None,
  '269': GotchiRarityPrices.None,
  '270': GotchiRarityPrices.None,
  '271': GotchiRarityPrices.None,
  '272': GotchiRarityPrices.None,
  '273': GotchiRarityPrices.None,
  '274': GotchiRarityPrices.None,
  '275': GotchiRarityPrices.None,
  '276': GotchiRarityPrices.None,
  '277': GotchiRarityPrices.None,
  '278': GotchiRarityPrices.None,
  '279': GotchiRarityPrices.None,
  '280': GotchiRarityPrices.None,
  '281': GotchiRarityPrices.None,
  '282': GotchiRarityPrices.None,
  '283': GotchiRarityPrices.None,
  '284': GotchiRarityPrices.None,
  '285': GotchiRarityPrices.None,
  '286': GotchiRarityPrices.None,
  '287': GotchiRarityPrices.None,
  '288': GotchiRarityPrices.None,
  '289': GotchiRarityPrices.None,
  '290': GotchiRarityPrices.None,
  '291': GotchiRarityPrices.None,
  '292': GotchiRarityPrices.Common,
  '293': GotchiRarityPrices.Common,
  '294': GotchiRarityPrices.Common,
  '295': GotchiRarityPrices.Common,
  '296': GotchiRarityPrices.Uncommon,
  '297': GotchiRarityPrices.Uncommon,
  '298': GotchiRarityPrices.Common,
  '299': GotchiRarityPrices.Uncommon,
  '300': GotchiRarityPrices.Uncommon,
  '301': GotchiRarityPrices.Rare,
  '302': GotchiRarityPrices.Rare,
  '303': GotchiRarityPrices.Rare,
  '304': GotchiRarityPrices.Rare,
  '305': GotchiRarityPrices.Legendary,
  '306': GotchiRarityPrices.Legendary,
  '307': GotchiRarityPrices.Legendary,
  '308': GotchiRarityPrices.Legendary,
  '309': GotchiRarityPrices.Mythical,
  '310': GotchiRarityPrices.Mythical,
  '311': GotchiRarityPrices.Mythical,
  '312': GotchiRarityPrices.Mythical,
  '313': GotchiRarityPrices.Godlike,
  '314': GotchiRarityPrices.Godlike,
  '315': GotchiRarityPrices.Godlike,

  //new
  '350': GotchiRarityPrices.Common,
  '351': GotchiRarityPrices.Common,
  '352': GotchiRarityPrices.Common,
  '353': GotchiRarityPrices.Common,
  '354': GotchiRarityPrices.Uncommon,
  '355': GotchiRarityPrices.Rare,
  '356': GotchiRarityPrices.Uncommon,
  '357': GotchiRarityPrices.Rare,
  '358': GotchiRarityPrices.Legendary,
  '359': GotchiRarityPrices.Legendary,
  '360': GotchiRarityPrices.Legendary,
  '361': GotchiRarityPrices.Legendary,
  '362': GotchiRarityPrices.Mythical,
  '363': GotchiRarityPrices.Mythical,
  '364': GotchiRarityPrices.Mythical,
  '365': GotchiRarityPrices.Mythical,
  '366': GotchiRarityPrices.Godlike,
  '367': GotchiRarityPrices.Godlike,
  '368': GotchiRarityPrices.Godlike,
  '369': GotchiRarityPrices.Godlike,
  '370': GotchiRarityPrices.Common,
  '371': GotchiRarityPrices.Common,
  '372': GotchiRarityPrices.Common,
  '373': GotchiRarityPrices.Uncommon,
  '374': GotchiRarityPrices.Rare,
  '375': GotchiRarityPrices.Common,
  '376': GotchiRarityPrices.Rare,
  '377': GotchiRarityPrices.Uncommon,
  '378': GotchiRarityPrices.Rare,
  '379': GotchiRarityPrices.Rare,
  '380': GotchiRarityPrices.Legendary,
  '381': GotchiRarityPrices.Legendary,
  '382': GotchiRarityPrices.Legendary,
  '383': GotchiRarityPrices.Legendary,
  '384': GotchiRarityPrices.Mythical,
  '385': GotchiRarityPrices.Godlike,
  '386': GotchiRarityPrices.Godlike,
  '387': GotchiRarityPrices.Godlike,

  //404 - 417
  '404': GotchiRarityPrices.Common,
  '405': GotchiRarityPrices.Common,
  '406': GotchiRarityPrices.Common,
  '407': GotchiRarityPrices.Uncommon,
  '408': GotchiRarityPrices.Uncommon,
  '409': GotchiRarityPrices.Uncommon,
  '410': GotchiRarityPrices.Uncommon,
  '411': GotchiRarityPrices.Rare,
  '412': GotchiRarityPrices.Rare,
  '413': GotchiRarityPrices.Rare,
  '414': GotchiRarityPrices.Legendary,
  '415': GotchiRarityPrices.Legendary,
  '416': GotchiRarityPrices.Mythical,
  '417': GotchiRarityPrices.Mythical
};

const tokenAbi = [
  'function balanceOf(address account) view returns (uint256)',
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

const maxResultsPerQuery = 1000;

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const args: {
    block?: { number: number };
  } = {};
  if (blockTag !== 'latest') args.block = { number: blockTag };

  const multi = new Multicaller(network, provider, tokenAbi, { blockTag });
  addresses.map((addr: string) => {
    multi.call(
      `${options.tokenAddress}.${addr.toLowerCase()}.itemBalances`,
      options.tokenAddress,
      'itemBalances',
      [addr]
    );
  });
  const multiRes = await multi.execute();

  const query = {
    users: {
      __args: {
        ...args,
        first: addresses.length,
        where: {
          id_in: addresses.map((addr) => addr.toLowerCase())
        }
      },
      id: true
    }
  };

  for (let i = 0; i <= 5; i++) {
    query.users['gotchisOriginalOwned' + i] = {
      __aliasFor: 'gotchisOriginalOwned',
      __args: {
        first: maxResultsPerQuery,
        skip: i * maxResultsPerQuery,
        orderBy: 'gotchiId'
      },
      baseRarityScore: true,
      equippedWearables: true
    };
  }

  const subgraphRaw = await subgraphRequest(
    AAVEGOTCHI_SUBGRAPH_URL[137],
    query
  );

  const result = Object.fromEntries(
    subgraphRaw.users.map((item) => {
      const ownedEntries = Object.entries(item)
        .map(([key, value]) => {
          if (key.startsWith('gotchis')) return value;
          else return [];
        })
        .flat();
      return [item.id, ownedEntries];
    })
  );

  return Object.fromEntries(
    addresses.map((address: string) => {
      const lowercaseAddr = address.toLowerCase();

      let gotchisBrsEquipValue = 0;
      const allGotchiInfo = result[lowercaseAddr];
      if (allGotchiInfo?.length > 0) {
        gotchisBrsEquipValue = allGotchiInfo.reduce(
          (total, { baseRarityScore, equippedWearables }) =>
            total +
            Number(baseRarityScore) +
            equippedWearables.reduce(
              (currentValue, nextIter) => currentValue + prices[nextIter],
              0
            ),
          0
        );
      }

      let ownerItemValue = 0;
      const ownerItemInfo =
        multiRes[options.tokenAddress][lowercaseAddr]['itemBalances'];
      if (ownerItemInfo?.length > 0) {
        ownerItemValue = ownerItemInfo.reduce((total, { balance, itemId }) => {
          const amountOwned = Number(balance.toString());
          const id = Number(itemId.toString());
          const pricetag = prices[id];
          let cost = pricetag * amountOwned;
          if (isNaN(cost)) cost = 0;
          return total + cost;
        }, 0);
      }

      return [address, ownerItemValue + gotchisBrsEquipValue];
    })
  );
}
