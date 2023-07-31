import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';

import { deployments, policies } from './configuration';
import {
  getRecipientStreams,
  getRecipientStreamedAmounts,
  getRecipientDepositedAmounts,
  getRecipientWithdrawableAmounts,
  getSenderStreams,
  getSenderDepositedAmounts
} from './queries';
import type { IOptions } from './configuration';

export const author = 'razgraf';
export const version = '0.0.1';

function validate(network: string, addresses: string[], options: IOptions) {
  if (!Object.hasOwn(deployments, network)) {
    throw new Error(
      'Invalid parameter. The chosen network has to be supported by Sablier V2.'
    );
  }

  if (!addresses || addresses?.length === 0) {
    throw new Error(
      'Invalid parameter. The addresses field must specify at least one account.'
    );
  }

  if (!options || !Object.values(policies).includes(options.policy)) {
    throw new Error(
      `Invalid parameter. The policy is not supported. Chose: ${
        options.policy
      }. Try: ${Object.values(policies).join(', ')}.`
    );
  }
}

export async function strategy(
  _space,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: IOptions,
  snapshot: number
): Promise<Record<string, number>> {
  const snap = typeof snapshot === 'number' ? snapshot : undefined;
  const block = snap || (await provider.getBlockNumber()) - 1;
  const setup = { block, network, provider };

  await validate(network, addresses, options);

  const balances = await (async () => {
    switch (options.policy) {
      case 'deposited-recipient': {
        const streams = await getRecipientStreams(addresses, options, setup);
        const balances = await getRecipientDepositedAmounts(streams);
        return balances;
      }
      case 'deposited-sender': {
        const streams = await getSenderStreams(addresses, options, setup);
        const balances = await getSenderDepositedAmounts(streams);
        return balances;
      }
      case 'streamed-recipient': {
        const streams = await getRecipientStreams(addresses, options, setup);
        const balances = await getRecipientStreamedAmounts(streams, setup);
        return balances;
      }
      case 'withdrawable-recipient':
      default: {
        const streams = await getRecipientStreams(addresses, options, setup);
        const balances = await getRecipientWithdrawableAmounts(streams, setup);
        return balances;
      }
    }
  })();

  /** Prepare the final object (checksum address, format amounts) */

  const prepared = {};
  balances.forEach((balance, recipient) => {
    prepared[getAddress(recipient)] = parseFloat(
      formatUnits(balance, options.decimals)
    );
  });

  console.log('=== SABLIER V2 ===');
  console.log(options.policy, prepared);

  return prepared;
}
