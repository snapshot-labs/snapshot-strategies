import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';
import { getAddress } from '@ethersproject/address';

import { abi } from './configuration';
import type { IOptions } from './configuration';
import { getRecipientStreams } from './queries';
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
  const recipients = options.isGlobal ? undefined : addresses;

  /** Query the subgraph to obtain a list of every recipient's streams */

  const mapping = await getRecipientStreams(
    network,
    recipients,
    options,
    block
  );

  /** Create an array of calls (in a multicall) for amounts on each stream of each recipient */

  const requests: { recipient: string; call: any }[] = [];
  mapping.forEach((streams, recipient) => {
    streams.forEach((stream) => {
      const method: keyof typeof abi = 'getDepositedAmount';
      const call = [stream.contract.toLowerCase(), method, [stream.id]];
      requests.push({ recipient, call });
    });
  });

  const results = await multicall(
    network,
    provider,
    Object.values(abi),
    requests.map((item) => item.call),
    { blockTag: block }
  );

  /** Aggregate results from streams with the same recipient into individual amounts */

  const balances: Map<string, BigNumber> = new Map();
  mapping.forEach((_, recipient) => {
    balances.set(recipient, BigNumber.from(0));
  });

  requests.forEach(({ recipient }, index) => {
    const balance = balances.get(recipient);
    const additional = results[index].toString();

    const total = balance
      ? balance?.add(BigNumber.from(additional))
      : BigNumber.from(0);

    balances.set(recipient, total);
  });

  /** Prepare the final object (checksum address, format amounts) */

  const prepared = {};
  balances.forEach((balance, recipient) => {
    prepared[getAddress(recipient)] = parseFloat(
      formatUnits(balance, options.decimals)
    );
  });

  console.log('=== SABLIER V2 TOTAL AMOUNTS ===');
  console.log(prepared);

  return prepared;
}
