import { getAddress } from '@ethersproject/address';
import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';

export const author = 'ganzai-san';
export const version = '0.1.2';

const isIPFS = (apiURL) => {
  return (
    apiURL.startsWith('https://gateway.pinata.cloud/ipfs/') ||
    apiURL.startsWith('https://ipfs.io/ipfs/') ||
    apiURL.startsWith('https://cloudflare-ipfs.com/ipfs/')
  );
};

const isStaticAPI = (apiURL: string): boolean => {
  return apiURL.endsWith('.json');
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const api: string = options.api;
  const strategy: string = options.strategy || '';
  const additionalParameters: string = options.additionalParameters || '';
  const staticFile: boolean = options.staticFile || false;

  let api_url = api + '/' + strategy;
  if (!isIPFS(api_url) && !isStaticAPI(api_url) && !staticFile) {
    api_url += '?network=' + network;
    api_url += '&snapshot=' + snapshot;
    api_url += '&addresses=' + addresses.join(',');
  }
  if (additionalParameters) api_url += '&' + additionalParameters;

  const response = await fetch(api_url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  return Object.fromEntries(
    data.score.map((value) => [
      getAddress(value.address),
      parseFloat(
        formatUnits(
          value.score.toString(),
          options.hasOwnProperty('decimals') ? options.decimals : 0
        )
      )
    ])
  );
}
