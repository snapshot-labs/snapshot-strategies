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

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let api_url = options.api + '/' + options.strategy;
  if (!isIPFS(api_url)) {
    api_url += '?network=' + network;
    api_url += '&snapshot=' + snapshot;
    api_url += '&addresses=' + addresses.join(',');
  }
  if (options.additionalParameters)
    api_url += '&' + options.additionalParameters;

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
      parseFloat(formatUnits(value.score.toString(), options.decimals))
    ])
  );
}
