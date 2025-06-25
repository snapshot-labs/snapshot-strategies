import { customFetch } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'thales-markets';
export const version = '1.0.0';
export const dependOnOtherAddress = true;

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
    // and set the smart account's score to 0 to prevent double counting.
    if (smartAccount !== undefined) {
      scores[address] = scores[address] + scores[smartAccount];
      scores[smartAccount] = 0;
    }
  }

  return scores;
}
