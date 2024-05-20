import fetch from 'cross-fetch';

export const author = 'thierbig';
export const version = '0.1.0';

export async function strategy(space, network, provider, addresses, options) {
  const url = options.url;

  if (!url) throw new Error('Invalid url');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  let responseData: any = await response.text();

  try {
    responseData = JSON.parse(responseData);
  } catch (e) {
    throw new Error(
      `[whitelist-weighted-json] Errors found in API: URL: ${url}, Status: ${response.status}` +
        response.ok
        ? `, Response: ${responseData.substring(0, 512)}`
        : ''
    );
  }

  const whitelist = Object.fromEntries(
    Object.entries(responseData).map(([addr, weight]) => [
      addr.toLowerCase(),
      weight
    ])
  );

  return Object.fromEntries(
    addresses.map((address) => [address, whitelist[address.toLowerCase()] || 0])
  );
}
