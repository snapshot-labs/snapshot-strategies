import { subgraphRequest } from '../../utils';

export const author = 'woodydeck';
export const version = '1.0.0';

// Constants
const url = {
  '1': 'https://gateway.thegraph.com/api/656e05ff867c74eeb11bf0199ff5de86/subgraphs/id/0x7859821024e633c5dc8a4fcf86fc52e7720ce525-1'
};

const getPower = (id, value) => {
  if (value == 0) return 0;
  return value * (parseInt(id.slice(2, 4)) * parseInt(id[4]));
};

// Strategy
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const requests = addresses.map((a) => ({
    erc1155Balances: {
      __args: {
        block: { number: snapshot !== 'latest' ? snapshot : undefined },
        where: {
          contract: '0xff3559412c4618af7c6e6f166c74252ff6364456',
          account: a.toLowerCase()
        }
      },
      valueExact: true,
      token: {
        identifier: true
      }
    }
  }));

  const responses = await Promise.all(
    requests.map((request) => subgraphRequest(url[network], request))
  );

  return Object.fromEntries(
    responses.map((response, i) => [
      addresses[i],
      response.erc1155Balances?.length > 0
        ? response.erc1155Balances
            .map((balance) => {
              return getPower(
                balance?.token?.identifier || '0',
                balance?.valueExact || '0'
              );
            })
            .reduce((prev, curr) => prev + curr, 0)
        : 0
    ])
  );
}
