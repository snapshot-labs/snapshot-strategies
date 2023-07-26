import fetch from 'cross-fetch';

export const author = 'ikisuke';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const url: string = options.url;
  const method = 'GET';
  const body: string | null = null;

  if (!url) throw new Error('Invalid url');

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
      `[wagumi-sbt] Errors found in API: URL: ${url}, Status: ${
        response.status
      }, Response: ${responseData.substring(0, 512)}`
    );
  }

  if (!responseData) throw new Error('Invalid response from API');

  const sbtHolders = responseData.map((holder) => holder.toLowerCase());
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      sbtHolders.includes(address.toLowerCase()) ? 1 : 0
    ])
  );
}
