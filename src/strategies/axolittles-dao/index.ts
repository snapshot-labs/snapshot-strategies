import fetch from 'cross-fetch';

export const author = 'toast';
export const version = '0.0.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let api_url = "https://axo-backend-pvj2l.ondigitalocean.app/get_voting_power?block=" + snapshot + "&address="
  for (const element of addresses) {
    api_url += element + ",";
  }
  api_url = api_url.substring(0,api_url.length-1);

  const response = await fetch(api_url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data
  ;
}
