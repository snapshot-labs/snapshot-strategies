import { customFetch } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'thales-markets';
export const version = '1.0.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const response = await customFetch(options.eoaToSmartAccountMapApi, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const eoaToSmartAccountMapping = await response.json();

  // Build a list of smart account addresses, and pass it to the base strategy along with the initial addresses.
  const smartAccountAddresses: string[] = [];
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const smartAccount = eoaToSmartAccountMapping[address];
    if (smartAccount !== undefined) {
      smartAccountAddresses.push(smartAccount);
    }
  }

  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    [...addresses, ...smartAccountAddresses],
    options,
    snapshot
  );

  for (let i = 0; i < Object.keys(scores).length; i++) {
    const address = Object.keys(scores)[i];
    const smartAccount = eoaToSmartAccountMapping[address];
    // If the current address has a mapped smart account, add the smart account's score to the owner's score
    if (smartAccount !== undefined) {
      scores[address] = scores[address] + scores[smartAccount];
    }
  }

  return scores;
}
