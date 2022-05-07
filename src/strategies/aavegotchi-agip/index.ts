import { Multicaller } from '../../utils';
import { subgraphRequest } from '../../utils';

export const author = 'candoizo';
export const version = '0.2.1';

const AAVEGOTCHI_SUBGRAPH_URL = {
  137: 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic'
};

const AAVEGOTCHI_LENDING_SUBGRAPH_URL = {
  137: 'https://api.thegraph.com/subgraphs/id/QmXb4Wsaj3LFMZicuRmGRg9xTNFjL6pYEXbwktdF7JXYGH'
};

const prices = {
  '0': 0,
  '1': 5,
  '2': 5,
  '3': 5,
  '4': 10,
  '5': 10,
  '6': 10,
  '7': 100,
  '8': 100,
  '9': 100,
  '10': 300,
  '11': 300,
  '12': 300,
  '13': 2000,
  '14': 2000,
  '15': 2000,
  '16': 10000,
  '17': 10000,
  '18': 5,
  '19': 5,
  '20': 5,
  '21': 10,
  '22': 10,
  '23': 10,
  '24': 100,
  '25': 100,
  '26': 100,
  '27': 300,
  '28': 300,
  '29': 300,
  '30': 2000,
  '31': 2000,
  '32': 2000,
  '33': 10000,
  '34': 10000,
  '35': 10000,
  '36': 5,
  '37': 5,
  '38': 5,
  '39': 10,
  '40': 10,
  '41': 10,
  '42': 100,
  '43': 100,
  '44': 100,
  '45': 300,
  '46': 300,
  '47': 300,
  '48': 2000,
  '49': 2000,
  '50': 2000,
  '51': 2000,
  '52': 10000,
  '53': 10000,
  '54': 10000,
  '55': 100,
  '56': 100,
  '57': 100,
  '58': 100,
  '59': 100,
  '60': 5,
  '61': 300,
  '62': 2000,
  '63': 10000,
  '64': 5,
  '65': 300,
  '66': 5,
  '67': 5,
  '68': 5,
  '69': 5,
  '70': 2000,
  '71': 100,
  '72': 2000,
  '73': 2000,
  '74': 2000,
  '75': 2000,
  '76': 5,
  '77': 10,
  '78': 10,
  '79': 100,
  '80': 100,
  '81': 100,
  '82': 300,
  '83': 100,
  '84': 300,
  '85': 300,
  '86': 2000,
  '87': 10,
  '88': 10,
  '89': 100,
  '90': 5,
  '91': 10,
  '92': 100,
  '93': 300,
  '94': 10,
  '95': 10,
  '96': 10,
  '97': 300,
  '98': 300,
  '99': 2000,
  '100': 300,
  '101': 300,
  '102': 300,
  '103': 2000,
  '104': 300,
  '105': 300,
  '106': 300,
  '107': 10000,
  '108': 10,
  '109': 10,
  '110': 100,
  '111': 300,
  '112': 300,
  '113': 10000,
  '114': 2000,
  '115': 300,
  '116': 100,
  '117': 5,
  '118': 300,
  '119': 300,
  '120': 300,
  '121': 100,
  '122': 2000,
  '123': 10,
  '124': 2000,
  '125': 300,
  '126': 5,
  '127': 20,
  '128': 20,
  '129': 50,
  '130': 5,
  '131': 10,
  '132': 100,
  '133': 300,
  '134': 5,
  '135': 10,
  '136': 100,
  '137': 5,
  '138': 10,
  '139': 100,
  '140': 5,
  '141': 10,
  '142': 100,
  '143': 300,
  '144': 2000,
  '145': 10000,
  '146': 5,
  '147': 10,
  '148': 100,
  '149': 300,
  '150': 2000,
  '151': 5,
  '152': 10,
  '153': 100,
  '154': 300,
  '155': 2000,
  '156': 10000,
  '157': 10,
  '158': 100,
  '159': 300,
  '160': 2000,
  '161': 10000,
  '162': 5,
  '163': 0,
  '164': 0,
  '165': 0,
  '166': 0,
  '167': 0,
  '168': 0,
  '169': 0,
  '170': 0,
  '171': 0,
  '172': 0,
  '173': 0,
  '174': 0,
  '175': 0,
  '176': 0,
  '177': 0,
  '178': 0,
  '179': 0,
  '180': 0,
  '181': 0,
  '182': 0,
  '183': 0,
  '184': 0,
  '185': 0,
  '186': 0,
  '187': 0,
  '188': 0,
  '189': 0,
  '190': 0,
  '191': 0,
  '192': 0,
  '193': 0,
  '194': 0,
  '195': 0,
  '196': 0,
  '197': 0,
  '198': 0,
  '199': 100,
  '200': 10,
  '201': 300,
  '202': 2000,
  '203': 100,
  '204': 10,
  '205': 5,
  '206': 100,
  '207': 10,
  '208': 10,
  '209': 300,
  '210': 5,
  '211': 5,
  '212': 3000,
  '213': 300,
  '214': 10000,
  '215': 300,
  '216': 3000,
  '217': 3000,
  '218': 10,
  '219': 100,
  '220': 300,
  '221': 5,
  '222': 10,
  '223': 10,
  '224': 100,
  '225': 5,
  '226': 100,
  '227': 100,
  '228': 5,
  '229': 10,
  '230': 5,
  '231': 10,
  '232': 5,
  '233': 10,
  '234': 3000,
  '235': 300,
  '236': 100,
  '237': 3000,
  '238': 10000,
  '239': 10,
  '240': 10,
  '241': 100,
  '242': 300,
  '243': 100,
  '244': 100,
  '245': 100,
  '246': 10,
  '247': 10,
  '248': 10,
  '249': 100,
  '250': 100,
  '251': 100,
  '252': 5,
  '253': 5,
  '254': 5,
  '255': 300,
  '256': 300,
  '257': 300,
  '258': 10000,
  '259': 10000,
  '260': 10000,
  '261': 2000,
  '262': 2000,
  '263': 2000,
  '264': 0,
  '265': 0,
  '266': 0,
  '267': 0,
  '268': 0,
  '269': 0,
  '270': 0,
  '271': 0,
  '272': 0,
  '273': 0,
  '274': 0,
  '275': 0,
  '276': 0,
  '277': 0,
  '278': 0,
  '279': 0,
  '280': 0,
  '281': 0,
  '282': 0,
  '283': 0,
  '284': 0,
  '285': 0,
  '286': 0,
  '287': 0,
  '288': 0,
  '289': 0,
  '290': 0,
  '291': 0,
  '292': 5,
  '293': 5,
  '294': 5,
  '295': 5,
  '296': 10,
  '297': 10,
  '298': 5,
  '299': 10,
  '300': 10,
  '301': 100,
  '302': 100,
  '303': 100,
  '304': 100,
  '305': 300,
  '306': 300,
  '307': 300,
  '308': 300,
  '309': 2000,
  '310': 2000,
  '311': 2000,
  '312': 2000,
  '313': 10000,
  '314': 10000,
  '315': 10000
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

const userKey = (key: string, addr: string, queryKey: string | number) =>
  [key, addr, queryKey].join('_');

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
  addresses.map((addr: string) => {
    multi.call(
      `${options.tokenAddress}.${addr.toLowerCase()}.itemBalances`,
      options.tokenAddress,
      'itemBalances',
      [addr]
    );
    multi.call(
      `${options.tokenAddress}.${addr.toLowerCase()}.balanceOf`,
      options.tokenAddress,
      'balanceOf',
      [addr]
    );
  });
  const multiRes = await multi.execute();

  const maxResultsPerQuery = 1000;
  const walletQueryParams = (user: string) => {
    user = user.toLowerCase();

    const args: {
      block?: { number: number };
    } = {};
    if (blockTag !== 'latest') args.block = { number: blockTag };

    const balanceOfGotchis = Number(
      multiRes[options.tokenAddress][user]['balanceOf'].toString()
    );
    let queriesNeeded = balanceOfGotchis / maxResultsPerQuery;
    if (queriesNeeded == 0) queriesNeeded = 1;
    const res = {};
    for (let i = 0; i < queriesNeeded; i++) {
      res[userKey('aavegotchis', user, i * maxResultsPerQuery)] = {
        __aliasFor: 'aavegotchis',
        __args: {
          ...args,
          skip: i * maxResultsPerQuery,
          first: 1000,
          where: {
            owner: user
          }
        },
        baseRarityScore: true,
        equippedWearables: true,
        gotchiId: true
      };
    }
    return res;
  };

  const walletLendingQueryParams = (user: string) => {
    user = user.toLowerCase();

    const args: {
      block?: { number: number };
    } = {};
    if (blockTag !== 'latest') args.block = { number: blockTag };

    const balanceOfGotchis = Number(
      multiRes[options.tokenAddress][user]['balanceOf'].toString()
    );
    const queriesNeeded = balanceOfGotchis / maxResultsPerQuery;
    const res = {};
    for (let i = 0; i < queriesNeeded; i++) {
      res[userKey('gotchiBorrowExclusions', user, i * maxResultsPerQuery)] = {
        __aliasFor: 'gotchiLendings',
        __args: {
          ...args,
          skip: i * maxResultsPerQuery,
          first: 1000,
          where: {
            borrower: user,
            timeAgreed_gt: 0,
            completed: false,
            cancelled: false
          }
        },
        gotchi: { gotchiId: true }
      };
    }
    for (let i = 0; i < 5; i++) {
      res[userKey('gotchiLendings', user, i * maxResultsPerQuery)] = {
        __aliasFor: 'gotchiLendings',
        __args: {
          ...args,
          skip: i * maxResultsPerQuery,
          first: 1000,
          where: {
            lender: user,
            timeAgreed_gt: 0,
            completed: false,
            cancelled: false
          }
        },
        gotchi: { baseRarityScore: true, equippedWearables: true }
      };
    }
    return res;
  };

  const result = await subgraphRequest(
    AAVEGOTCHI_SUBGRAPH_URL[network],
    addresses.map((addr: string) => walletQueryParams(addr))
  );

  const lendingResult = await subgraphRequest(
    AAVEGOTCHI_LENDING_SUBGRAPH_URL[network],
    addresses.map((addr: string) => walletLendingQueryParams(addr))
  );

  return Object.fromEntries(
    addresses.map((address: string) => {
      const lowercaseAddr = address.toLowerCase();
      const balanceOfGotchis = Number(
        multiRes[options.tokenAddress][lowercaseAddr]['balanceOf'].toString()
      );
      const queriesMade = balanceOfGotchis / maxResultsPerQuery;
      const gotchisOwned: any[] = [];
      const gotchisExcluded: number[] = [];
      for (let i = 0; i < queriesMade; i++) {
        const info =
          result[userKey('aavegotchis', lowercaseAddr, i * maxResultsPerQuery)];
        if (info?.length > 0) gotchisOwned.push(...info);

        const excludeInfo =
          lendingResult[
            userKey(
              'gotchiBorrowExclusions',
              lowercaseAddr,
              i * maxResultsPerQuery
            )
          ];
        if (excludeInfo?.length > 0)
          gotchisExcluded.push(
            ...excludeInfo.map(({ gotchi }) => gotchi.gotchiId)
          );
      }

      for (let i = 0; i < 5; i++) {
        const info =
          lendingResult[
            userKey('gotchiLendings', lowercaseAddr, i * maxResultsPerQuery)
          ];
        if (info?.length > 0)
          gotchisOwned.push(...info.map(({ gotchi }) => gotchi));
      }

      let gotchisBrsEquipValue = 0;
      if (gotchisOwned.length > 0) {
        const allGotchiInfo = gotchisOwned.filter(
          ({ gotchiId }) => gotchisExcluded.includes(gotchiId) == false
        );

        if (allGotchiInfo.length > 0)
          allGotchiInfo.map((gotchi) => {
            const brs = parseInt(gotchi.baseRarityScore);
            gotchisBrsEquipValue += brs;
            gotchi.equippedWearables
              .filter((itemId: number) => itemId != 0)
              .map((itemId) => {
                let shopCost = prices[itemId];
                if (isNaN(shopCost)) shopCost = 0;
                gotchisBrsEquipValue += shopCost;
              });
          });
      }

      let ownerItemValue = 0;
      const ownerItemInfo =
        multiRes[options.tokenAddress][lowercaseAddr]['itemBalances'];
      if (ownerItemInfo.length > 0)
        ownerItemInfo.map((itemInfo) => {
          const amountOwned = parseInt(itemInfo.balance.toString());
          const itemId = parseInt(itemInfo.itemId.toString());
          const pricetag = parseFloat(prices[itemId]);
          let cost = pricetag * amountOwned;
          if (isNaN(cost)) cost = 0;
          ownerItemValue += cost;
        });

      return [address, ownerItemValue + gotchisBrsEquipValue];
    })
  );
}
