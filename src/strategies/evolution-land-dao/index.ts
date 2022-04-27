import { formatUnits } from '@ethersproject/units';
import { getProvider, call } from '../../utils';

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
  if (options.row !== undefined && options.row !== 0 && options.row !== '') {
    row = options.row;
  }

  const strategy = options;
  if (strategy.api_host !== '' && strategy.api_host !== undefined) {
    // get Heco network vote from evo backend
    const resp = await get_heco_account_vote(
      addresses,
      strategy.api_host,
      blockTag,
      network
    );
    addresses.forEach((address) => {
      if (!accountVote.hasOwnProperty(address)) {
        accountVote[address] = 0;
      }
      if (resp.hasOwnProperty(address)) {
        accountVote[address] += resp[address].land * strategy.land_multiplier;
        accountVote[address] +=
          resp[address].apostle * strategy.apostle_multiplier;
      }
    });
    return;
  }

  const promiseArray: Promise<any>[] = [];
  const promiseArrayInfo: string[] = [];
  addresses.forEach((address) => {
    promiseArrayInfo.push(address);
    promiseArray.push(
      call(getProvider(network), abi, [
        strategy.address,
        'totalOfEVO',
        [address]
      ])
    );
  });
  const res = await Promise.all(promiseArray);

  const multiCalls: Promise<any>[] = [];
  const multiCallsInfo: string[] = [];
  for (let i = 0; i < res.length; i++) {
    const address = promiseArrayInfo[i];
    const vote = parseFloat(formatUnits(res[i], 1)) * 10;

    const page = Math.ceil(vote / row);
    for (let k = 0; k < page * row; k += row) {
      let currentRow = k + row;
      if (currentRow > vote) {
        currentRow = vote;
      }
      multiCallsInfo.push(address);
      if (vote <= 0) {
        multiCalls.push(
          call(getProvider(network), abi, [
            strategy.address,
            'totalOfEVO',
            [address]
          ])
        );
        continue;
      }
      multiCalls.push(
        call(getProvider(network), abi, [
          strategy.address,
          'balanceOfEVO',
          [address, k, currentRow]
        ])
      );
    }
  }

  const resp = await Promise.all(multiCalls);
  const accountVote: Map<string, number> = new Map();
  for (let i = 0; i < resp.length; i++) {
    const address = multiCallsInfo[i];
    // get land apostles vote
    if (!accountVote.hasOwnProperty(address)) {
      accountVote[address] = 0;
    }
    let landNumber = 0;
    let apostleNumber = 0;
    if (resp[i].length > 1) {
      landNumber = parseFloat(formatUnits(resp[i][0], strategy.decimals));
      apostleNumber = parseFloat(formatUnits(resp[i][1], strategy.decimals));
    }

    accountVote[address] += landNumber * strategy.land_multiplier;
    accountVote[address] += apostleNumber * strategy.apostle_multiplier;
  }
  return accountVote;
}
