import { strategy as fraxFinanceBaseStrategy } from '../frax-finance';
import { getDelegations } from '../../utils/delegation';

export const author = 'fraxfinance';
export const version = '0.0.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // Get the delegations, if any, for the provided addresses
  // Keys are the delegatees, which receive the votes
  const delegations = await getDelegations(space, network, addresses, snapshot);
  console.debug('Delegations', delegations);

  // Get all of the delegators for the above addresses
  const delegatorsArray = Object.values(
    delegations
  ).reduce((a: string[], b: string[]) => a.concat(b)) as string[];
  console.debug("delegatorsArray: ", delegatorsArray);

  // Get the scores of the delegators
  const delegatorScores = await fraxFinanceBaseStrategy(
    space,
    network,
    provider,
    delegatorsArray,
    options,
    snapshot
  );
  console.debug('Delegators scores', delegatorScores);

  // Get the direct scores of the addresses provided
  const directScores = await fraxFinanceBaseStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  console.debug('Direct scores', directScores);

  // Calculate the score
  return Object.fromEntries(
    addresses.map(address => {
      let addressScore = 0;

      // If the address is a delegator, its score is zero since it delegated it away
      // Otherwise, sum the address's direct score and the score(s) delegated to it
      if (!delegatorsArray.includes(address)) {
        // Add direct score
        addressScore += directScores[address];

        // Add delegated score(s)
        if (delegations[address] && delegations[address].length > 0) addressScore += delegations[address].reduce((a, b) => a + delegatorScores[b], 0);
      }

      return [address, addressScore];
    })
  );
}
