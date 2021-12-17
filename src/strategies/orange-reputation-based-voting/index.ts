import fetch from 'cross-fetch';

export const author = 'joeuan';
export const version = '0.1.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const query = `{
    getBasedVotingStrategy(addrs: ${JSON.stringify(
      addresses
    )}, space: "${space}")
    { address score }
  }`;
  const data = {
    operationName: '',
    query,
    variables: {}
  };
  const rawResponse = await fetch('http://172.168.3.38:8080/query', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const content = await rawResponse.json();
  const list = content.data.getBasedVotingStrategy;
  return Object.fromEntries(list.map((item) => [item.address, item.score]));
}
