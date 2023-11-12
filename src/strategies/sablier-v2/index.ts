import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';

import { deployments, policies } from './configuration';
import {
  getLatestBlock,
  getRecipientDepositedAmounts,
  getRecipientReservedAmounts,
  getRecipientStreams,
  getRecipientStreamedAmounts,
  getRecipientUnstreamedAmounts,
  getRecipientWithdrawableAmounts,
  getSenderDepositedAmounts,
  getSenderStreams
} from './queries';
import type { IOptions } from './configuration';

export const author = 'razgraf';
export const version = '0.0.1';

function validate(network: string, addresses: string[], options: IOptions) {
  if (!Object.hasOwn(deployments, network)) {
    throw new Error(
      'Invalid parameter. The provided network is not supported by Sablier V2.'
    );
  }

  if (!addresses || addresses?.length === 0) {
    throw new Error(
      'Invalid parameter. The addresses field must contain at least one address.'
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
  const block = await getLatestBlock(network, provider, snapshot);
  const setup = { block, network, provider };

  await validate(network, addresses, options);

  const balances = await (async () => {
    switch (options.policy) {
      case 'withdrawable-recipient':
      default: {
        const streams = await getRecipientStreams(addresses, options, setup);
        const { amounts } = await getRecipientWithdrawableAmounts(
          streams,
          setup
        );
        return amounts;
      }
      case 'reserved-recipient': {
        const streams = await getRecipientStreams(addresses, options, setup);
        const { amounts } = await getRecipientReservedAmounts(streams, setup);
        return amounts;
      }
      case 'deposited-recipient': {
        const streams = await getRecipientStreams(addresses, options, setup);
        const { amounts } = await getRecipientDepositedAmounts(streams);
        return amounts;
      }
      case 'deposited-sender': {
        const streams = await getSenderStreams(addresses, options, setup);
        const { amounts } = await getSenderDepositedAmounts(streams);
        return amounts;
      }
      case 'streamed-recipient': {
        const streams = await getRecipientStreams(addresses, options, setup);
        const { amounts } = await getRecipientStreamedAmounts(streams, setup);
        return amounts;
      }
      case 'unstreamed-recipient': {
        const streams = await getRecipientStreams(addresses, options, setup);
        const { amounts } = await getRecipientUnstreamedAmounts(streams, setup);
        return amounts;
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
