import fetch from 'cross-fetch';
import examplesFile from './examples.json';

export const author = 'deversifi';
export const version = '0.1.0';
export const examples = examplesFile;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const { api, token, limit = 300 } = options;

  const pages = Math.ceil(addresses.length / limit);
  const promises: any = [];

  let api_url = api;
  api_url += `?blockNumber=${snapshot}`;
  api_url += `&token=${token}`;

  Array.from(Array(pages)).forEach((x, i) => {
    const pageAddresses = addresses.slice(limit * i, limit * (i + 1));
    promises.push(
      fetch(`${api_url}&addresses=${pageAddresses.join('&addresses=')}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
    );
  });

  const results = await Promise.all(promises);
  const resultsJson = await Promise.all(results.map((r: any) => r.json()));

  const data: any = resultsJson.reduce((res: any, item: any) => {
    if (item.score) {
      return [...res, ...item.score];
    }
    return res;
  }, []);

  return Object.fromEntries(
    data.map((value) => [value.address, parseFloat(value.score)])
  );
}
