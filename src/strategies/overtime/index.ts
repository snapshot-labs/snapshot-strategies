import { customFetch } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'thales-markets';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const response = await customFetch(options.eoaToSmartAccountMapApi, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const eoaToSmartAccountMapping = await response.json();

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
