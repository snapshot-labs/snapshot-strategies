import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import type { IOptions } from './configuration';
import {
  getRecipientStreams,
  getRecipientStreamedAmounts,
  getRecipientDepositedAmounts,
  getRecipientWithdrawableAmounts,
  getSenderStreams,
  getSenderDepositedAmounts
} from './queries';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';

export const author = 'razgraf';
export const version = '0.0.1';

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
  const accounts = options.accounts === 'all' ? undefined : addresses;
  const setup = { block, network, provider };

  const balances = await (async () => {
    switch (options.policy) {
      case 'deposited-recipient': {
        const streams = await getRecipientStreams(accounts, options, setup);
        const balances = await getRecipientDepositedAmounts(streams);
        return balances;
      }
      case 'deposited-sender': {
        const streams = await getSenderStreams(accounts, options, setup);
        const balances = await getSenderDepositedAmounts(streams);
        return balances;
      }
      case 'streamed-recipient': {
        const streams = await getRecipientStreams(accounts, options, setup);
        const balances = await getRecipientStreamedAmounts(streams, setup);
        return balances;
      }
      case 'withdrawable-recipient':
      default: {
        const streams = await getRecipientStreams(accounts, options, setup);
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

  console.log(`=== SABLIER V2 AMOUNTS === | ${options.policy}`);
  console.log(prepared);

  return prepared;
}
