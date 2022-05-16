import fetch from 'cross-fetch';

export const author = 'dvision';
export const version = '0.0.1';

export async function strategy(space, network, provider, addresses, options) {
  const score = {};
  const response = await fetch(
    `${options.url}/api/votepower?wallet=${addresses[0]}&network=${network}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const vp = await response.json();
  score[addresses[0]] = vp;
  return score;
}
