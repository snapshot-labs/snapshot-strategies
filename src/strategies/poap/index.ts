import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'greenealexander';
export const version = '1.0.0';

const POAP_API_ENDPOINT_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap',
  '100': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap-xdai'
};
// subgraph query in filter has max length of 500
const MAX_ACCOUNTS_IN_QUERY = 500;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  snapshot
) {
  const addressesMap = addresses.reduce((map, address) => {
    map[getAddress(address)] = 0;
    return map;
  }, {});
  const lowercaseAddresses = Object.keys(addressesMap).map((address) =>
    address.toLowerCase()
  );

  // batch addresses to query into slices of MAX_ACCOUNTS_IN_QUERY size
  const lowercaseAddressBatches: string[][] = [];
  for (let i = 0; i < lowercaseAddresses.length; i += MAX_ACCOUNTS_IN_QUERY) {
    const slice = lowercaseAddresses.slice(i, i + MAX_ACCOUNTS_IN_QUERY);
    lowercaseAddressBatches.push(slice);
  }

  const results = await Promise.allSettled<{
    accounts: { id: string; tokensOwned: string }[];
  }>(
    lowercaseAddressBatches.map((addresses) => {
      const query = {
        accounts: {
          __args: {
            where: {
              id_in: addresses
            }
          },
          id: true,
          tokensOwned: true
        }
      };
      return subgraphRequest(POAP_API_ENDPOINT_URL[network], query);
    })
  );

  for (const supplyResponse of results) {
    if (supplyResponse.status === 'rejected') continue;

    for (const account of supplyResponse.value.accounts) {
      const accountId = getAddress(account.id);

      if (addressesMap[accountId] === undefined) continue;

      addressesMap[accountId] = parseInt(account.tokensOwned);
    }
  }

  return addressesMap;
}
