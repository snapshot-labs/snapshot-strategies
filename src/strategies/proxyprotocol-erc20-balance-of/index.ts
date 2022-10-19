import fetch from 'cross-fetch';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'rawrjustin';
export const version = '0.1.0';

const calculateVotingPower = (inputAddresses, addressScores, walletMap) => {
  const userVotingPower = {};
  inputAddresses.forEach((input) => {
    let count = 0.0;
    walletMap[input.toLowerCase()].forEach((address) => {
      count += addressScores[address];
    });
    userVotingPower[input] = count;
  });
  return userVotingPower;
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Get the wallet mapping from proxy wallets to actual wallets
  const url = 'https://api.proxychat.xyz/external/v0/getProxyWalletMappings';
  const params = {
    proxyAddresses: addresses
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  const data = await response.json();

  // Flatten the wallet mapping so it's an array of real wallets to query for tokens
  const arrayOfProxyWallets = Object.keys(data).map(function (key) {
    return data[key];
  });
  const flattenedWalletAddresses = [].concat.apply([], arrayOfProxyWallets);

  // Query for token holdings
  const addressScores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    flattenedWalletAddresses,
    options,
    snapshot
  );

  // Calculate the voting power across all wallets and map it back to original Proxy wallets.
  return calculateVotingPower(addresses, addressScores, data);
}
