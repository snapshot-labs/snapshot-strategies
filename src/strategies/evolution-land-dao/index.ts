import { formatUnits } from '@ethersproject/units';
// import { getSnapshots } from '../../utils/blockfinder';

const utils_1 = require('../../utils');
import fetch from 'cross-fetch';

export const author = 'perror';
export const version = '1.0.0';

const abi = [
  'function balanceOfEVO(address _account, uint start, uint end) public view returns (uint256 lands, uint apostles)',
  'function totalOfEVO(address _account) public view returns (uint total)',
  'function balanceOfStaking(address _account) external view returns (uint256)'
];

let row = 750;

const get_heco_account_vote = async (addresses, api, block, network) => {
  const resp = await fetch(api + '/api/snapshot/vote/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ addresses: addresses, block: block, chain: network })
  });
  return await resp.json();
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  // const blocks = await getSnapshots(
  //   network,
  //   snapshot,
  //   provider,
  //   options.strategies.map((s) => s.network || network)
  // );
  if (options.row !== undefined && options.row !== 0 && options.row !== '') {
    row = options.row;
  }

  const promiseArray: Promise<any>[] = [];
  const promiseArrayInfo: Map<string, any>[] = [];
  const requestApi: Map<string, any> = new Map();

  options.strategies.forEach((strategy) => {
    if (strategy.api_host !== '' && strategy.api_host !== undefined) {
      requestApi.set('is_use', true);
      requestApi.set('host', strategy.api_host);
      requestApi.set('land_multiplier', strategy.params.land_multiplier);
      requestApi.set('apostle_multiplier', strategy.params.apostle_multiplier);
      return;
    }
    addresses.forEach((address) => {
      promiseArrayInfo.push(
        new Map<string, any>([
          ['address', address],
          ['params', strategy.params],
          ['network', strategy.network]
        ])
      );
      promiseArray.push(
        utils_1.call(utils_1.getProvider(strategy.network), abi, [
          strategy.params.address,
          'totalOfEVO',
          [address]
        ])
      );
    });
  });
  const res = await Promise.all(promiseArray);

  const multiNetworkCalls: Promise<any>[] = [];
  const multiNetworkCallsInfo: Map<string, any>[] = [];
  for (let i = 0; i < res.length; i++) {
    const info = promiseArrayInfo[i];
    const vote = parseFloat(formatUnits(res[i], 1)) * 10;

    const page = Math.ceil(vote / row);
    for (let k = 0; k < page * row; k += row) {
      let currentRow = k + row;
      if (currentRow > vote) {
        currentRow = vote;
      }
      multiNetworkCallsInfo.push(
        new Map<string, any>([
          ['address', info.get('address')],
          ['params', info.get('params')],
          ['vote', vote]
        ])
      );
      if (vote <= 0) {
        multiNetworkCalls.push(
          utils_1.call(utils_1.getProvider(info.get('network')), abi, [
            info.get('params').address,
            'totalOfEVO',
            [info.get('address')]
          ])
        );
        continue;
      }
      multiNetworkCalls.push(
        utils_1.call(utils_1.getProvider(info.get('network')), abi, [
          info.get('params').address,
          'balanceOfEVO',
          [info.get('address'), k, currentRow]
        ])
      );
    }
  }

  const resp = await Promise.all(multiNetworkCalls);
  const accountVote: Map<string, number> = new Map();
  for (let i = 0; i < resp.length; i++) {
    const info = multiNetworkCallsInfo[i];
    const address = info.get('address');
    // get land apostles vote
    if (!accountVote.hasOwnProperty(address)) {
      accountVote[address] = 0;
    }
    let landNumber = 0;
    let apostleNumber = 0;
    if (resp[i].length > 1) {
      landNumber = parseFloat(
        formatUnits(resp[i][0], info.get('params').decimals)
      );
      apostleNumber = parseFloat(
        formatUnits(resp[i][1], info.get('params').decimals)
      );
    }

    accountVote[address] += landNumber * info.get('params').land_multiplier;
    accountVote[address] +=
      apostleNumber * info.get('params').apostle_multiplier;
  }
  // get Heco network vote from evo backend
  if (requestApi.has('is_use')) {
    const resp = await get_heco_account_vote(
      addresses,
      requestApi.get('host'),
      blockTag,
      network
    );
    addresses.forEach((address) => {
      if (!accountVote.hasOwnProperty(address)) {
        accountVote[address] = 0;
      }
      if (resp.hasOwnProperty(address)) {
        accountVote[address] += resp[address].land * requestApi.get('land_multiplier');
        accountVote[address] += resp[address].apostle * requestApi.get('apostle_multiplier');
      }
    });
  }
  return accountVote;
}
