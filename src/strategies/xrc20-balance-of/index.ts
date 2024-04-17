import fetch from 'cross-fetch';
import { strategy as erc20BalanceStrategy } from '../erc20-balance-of';

interface ApiReturn {
  balance: string[];
}

export const author = 'iotexproject';
export const version = '0.0.2';

const testNetUrl = 'https://analyser-api.testnet.iotex.io';
const mainNetUrl = 'https://analyser-api.iotex.io';

function getUrl(network) {
  return network == 4689 ? mainNetUrl : testNetUrl;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  if (blockTag == 'latest')
    return erc20BalanceStrategy(
      space,
      network,
      provider,
      addresses,
      options,
      snapshot
    );

  const apiUrl = getUrl(network);
  const response = await fetch(
    `${apiUrl}/api.AccountService.Erc20TokenBalanceByHeight`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: addresses,
        height: snapshot,
        contract_address: options.address
      })
    }
  );

  const ret: ApiReturn = await response.json();
  return Object.fromEntries(
    ret.balance.map((v, i) => [addresses[i], parseFloat(v)])
  );
}
