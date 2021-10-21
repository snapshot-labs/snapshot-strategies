import { subgraphRequest } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'yangzhao28';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const query = {
    accounts: {
      __args: {
        where: {
          id_in: addresses
        },
        first: 1000
      },
      id: true,
      balance: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    query.accounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    options.graph,
    query
  )
  const scores = {}
  if (result && result.accounts) {
    const scaler = BigNumber.from(10).pow(options.decimals || 18)
    addresses.forEach(address => {
      const account = result.accounts.filter(x => x.id == address)[0]
      let score = 0
      if (account) {
        if (options.decimals) {
          score = BigNumber.from(account.balance).div(scaler).toNumber();
        } else {
          score = parseFloat(account.balance);
        }
      }
      scores[address] = score
    })
  }
  return scores || {}
}
