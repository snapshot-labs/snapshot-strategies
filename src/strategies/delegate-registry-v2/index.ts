import fetch from 'cross-fetch';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Strategy } from '@snapshot-labs/snapshot.js/dist/voting/types';
import { getScoresDirect } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'gnosis';
export const version = '0.0.2';

const DEFAULT_BACKEND_URL = 'https://delegate-registry-backend.vercel.app';

type Params = {
  backendUrl: string;
  strategies: Strategy[];
  delegationV1VChainIds?: number[]; // add this to include v1 delegations
};

/*
  This strategy:
  - returns a score of 0 for addresses that are delegating to other addresses (PS: addresses that returns a score of 0, should not be allowed to vote),
  - returns a score greater than 0, for addresses that are delegated to (PS: only the amount delegated to the address us returned, this needs to be merged with the scores from other strategies in the space),
  - returns nothing for addresses that are not delegating to other addresses or delegated to.
*/
export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: Params = { backendUrl: DEFAULT_BACKEND_URL, strategies: [] },
  snapshot: string | number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  if (options.strategies.length > 8)
    throw new Error('Maximum 8 strategies allowed');

  const response = await fetch(
    `${options.backendUrl}/api/${space}/snapshot/${blockTag}/strategy-formatted-vote-weights`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spaceParams: {
          ...options,
          mainChainId: Number(network)
        },
        addresses
      })
    }
  );

  const delegationScores = (await response.json()) as [
    address: string,
    voteWeight: string
  ][];

  // gets an array of all addresses that are in the addresses array, but not present in the response
  const addressesNotDelegatingOrDelegatedTo = addresses.filter(
    (address) => !delegationScores.find((score) => score[0] === address)
  );

  const addressesDelegating = delegationScores.filter(
    (score) => score[1] === '0'
  );

  const addressesDelegatedTo = delegationScores.filter(
    (score) => score[1] !== '0'
  );

  const addressesOwnScore = await getScoresDirect(
    space,
    options.strategies,
    network,
    provider,
    [
      ...addressesNotDelegatingOrDelegatedTo,
      ...addressesDelegatedTo.map(([address]) => address)
    ],
    blockTag
  );

  const delegationObject = addressesDelegatedTo.reduce(
    (pre, [address, score]) => {
      pre[getAddress(address)] = score;
      return pre;
    },
    {}
  );

  const addressesScores = addressesOwnScore.reduce((pre, address) => {
    const addressKeys = Object.keys(address);
    const addressValues = Object.values(address);
    addressKeys.forEach((key, index) => {
      if (pre.hasOwnProperty(key)) {
        pre[getAddress(key)] = pre[getAddress(key)] + addressValues[index];
      } else {
        pre[getAddress(key)] = addressValues[index];
      }
    });
    return pre;
  }, delegationObject);

  // add a 0 score for all addressesDelegating
  const finalScores = addressesDelegating.reduce((pre, [address]) => {
    pre[getAddress(address)] = 0;
    return pre;
  }, addressesScores);

  return finalScores;
}
