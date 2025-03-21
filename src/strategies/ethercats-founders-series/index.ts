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
  const request: any = {
    erc1155Balances: {
      __args: {
        where: {
          contract_in: ['0xff3559412c4618af7c6e6f166c74252ff6364456'],
          account_in: addresses.map((address) => address.toLowerCase())
        }
      },
      valueExact: true,
      account: {
        id: true
      },
      contract: {
        id: true
      },
      token: {
        identifier: true
      }
    }
  };

  if (snapshot === 'number') {
    request.erc1155Balances.__args.block = { number: snapshot };
  }

  const response = await subgraphRequest(url[network], request);

  const scores = {};
  addresses.forEach((address) => {
    const score =
      response.erc1155Balances?.length > 0
        ? response.erc1155Balances
            .filter((x) => x.account.id == address.toLowerCase())
            .reduce((acc, account) => {
              const score = getPower(
                account?.token?.identifier || '0',
                account?.valueExact || '0'
              );
              return acc + score;
            }, 0)
        : 0;
    scores[address] = score;
  });

  return scores;
}
