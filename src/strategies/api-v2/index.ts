import { getAddress } from '@ethersproject/address';
import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';

export const author = 'snapshot-labs';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let url: string = options.url;
  const additionalParameters: string = options.additionalParameters || '';
  const type: string = options.type || 'api-get';
  const method: string = type === 'api-post' ? 'POST' : 'GET';
  let body: string | null = null;

  if (!url) throw new Error('Invalid url');

  if (type === 'ipfs') {
    url = url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  } else if (type === 'api-get') {
    url += '?network=' + network;
    url += '&snapshot=' + snapshot;
    url += '&addresses=' + addresses.join(',');
    if (additionalParameters) url += '&' + additionalParameters;
  } else if (type === 'api-post') {
    const requestBody = {
      options,
      network,
      snapshot,
      addresses
    };
    body = JSON.stringify(requestBody);
  }

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body
  });
  let responseData: any = await response.text();
  try {
    responseData = JSON.parse(responseData);
  } catch (e) {
    throw new Error(
      `[api-v2] Errors found in API: URL: ${url}, Status: ${
        response.status
      }, Response: ${responseData.substring(0, 512)}`
    );
  }

  if (!responseData?.score) throw new Error('Invalid response from API');

  return Object.fromEntries(
    addresses.map((address) => [
      getAddress(address),
      parseFloat(
        formatUnits(
          responseData.score
            .find((s) => s.address === address)
            ?.score?.toString() || '0',
          options.hasOwnProperty('decimals') ? options.decimals : 0
        )
      )
    ])
  );
}
