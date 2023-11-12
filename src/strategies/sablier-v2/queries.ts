import { BigNumber } from '@ethersproject/bignumber';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import type {
  IOptions,
  IAccountMap,
  IStreamsByAssetParams,
  IStreamsByAssetResult
} from './configuration';

import { abi, deployments, queries, page } from './configuration';
import { multicall, subgraphRequest } from '../../utils';
import fetch from 'cross-fetch';

/**
 * Query the subgraph for all the streams owned by all recipients.
 *
 * @returns A mapping from each recipient to their list of owned streams.
 */
async function getRecipientStreams(
  recipients: string[],
  options: IOptions,
  setup: {
    block: number;
    network: string;
  }
) {
  const { block, network } = setup;
  const endpoint = deployments[network].subgraph;

  /** Mapping recipients to the streams they own */
  const streams: IAccountMap = new Map();
  if (recipients) {
    recipients.forEach((address) => {
      streams.set(address.toLowerCase(), []);
    });
  }

  let skip = 0;
  while (true) {
    const params: IStreamsByAssetParams = {
      accounts: recipients.map((item) => item.toLowerCase()),
      block,
      asset: options.address.toLowerCase(),
      first: page,
      skip: skip * page
    };

    const results = (await subgraphRequest(
      endpoint,
      queries.RecipientStreamsByAsset(params)
    )) as IStreamsByAssetResult;

    const list = results?.streams;

    if (list && list.length) {
      list.forEach((item) => {
        const recipient = item.recipient.toLowerCase();
        const entry = {
          id: item.tokenId,
          canceled: item.canceled,
          contract: item.contract.id,
          deposited: item.depositAmount,
          withdrawn: item.withdrawnAmount
        };

        if (!streams.has(recipient)) {
          streams.set(recipient, [entry]);
        } else {
          streams.set(recipient, [...(streams.get(recipient) || []), entry]);
        }
      });
    }

    skip += 1;
    if (list.length < page) {
      break;
    }
  }

  return streams;
}

/**
 * Query the subgraph for all the streams started by senders.
 *
 * @returns A mapping from each sender to their list of started streams.
 */
async function getSenderStreams(
  senders: string[],
  options: IOptions,
  setup: {
    block: number;
    network: string;
  }
) {
  const { block, network } = setup;
  const endpoint = deployments[network].subgraph;

  /** Mapping senders to the streams they own */
  const streams: IAccountMap = new Map();
  if (senders) {
    senders.forEach((address) => {
      streams.set(address.toLowerCase(), []);
    });
  }

  let skip = 0;
  while (true) {
    const params: IStreamsByAssetParams = {
      accounts: senders.map((item) => item.toLowerCase()),
      block,
      asset: options.address.toLowerCase(),
      first: page,
      skip: skip * page
    };

    const results = (await subgraphRequest(
      endpoint,
      queries.SenderStreamsByAsset(params)
    )) as IStreamsByAssetResult;

    const list = results?.streams;

    if (list && list.length) {
      list.forEach((item) => {
        const sender = item.proxied
          ? item.proxender.toLowerCase()
          : item.sender.toLowerCase();
        const entry = {
          id: item.tokenId,
          canceled: item.canceled,
          contract: item.contract.id,
          deposited: item.depositAmount,
          withdrawn: item.withdrawnAmount
        };

        if (!streams.has(sender)) {
          streams.set(sender, [entry]);
        } else {
          streams.set(sender, [...(streams.get(sender) || []), entry]);
        }
      });
    }

    skip += 1;
    if (list.length < page) {
      break;
    }
  }

  return streams;
}

/**
 * Query the blockchain for streamed amounts found in the recipients' streams.
 *
 * @returns Full amounts made up of streamed assets for each recipient and every stream.
 */
async function getRecipientStreamedAmounts(
  mapping: IAccountMap,
  setup: {
    block: number;
    network: string;
    provider: StaticJsonRpcProvider;
  }
) {
  const { block, network, provider } = setup;

  const requests: { recipient: string; call: any }[] = [];
  mapping.forEach((streams, recipient) => {
    streams.forEach((stream) => {
      const method: keyof typeof abi = 'streamedAmountOf';
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

  /** Aggregate results from streams with the same recipient into individual streamed amounts */

  const amounts: Map<string, BigNumber> = new Map();
  mapping.forEach((_, recipient) => {
    amounts.set(recipient, BigNumber.from(0));
  });

  requests.forEach(({ recipient }, index) => {
    const amount = amounts.get(recipient);
    const additional = results[index].toString();

    const total = (amount || BigNumber.from(0)).add(BigNumber.from(additional));
    amounts.set(recipient, total);
  });

  return { amounts };
}

/**
 * Query the blockchain for withdrawable amounts found in recipients' streams.
 *
 * @returns Full amounts made up of withdrawable assets for each recipient and every stream.
 */
async function getRecipientWithdrawableAmounts(
  mapping: IAccountMap,
  setup: {
    block: number;
    network: string;
    provider: StaticJsonRpcProvider;
  }
) {
  const { block, network, provider } = setup;

  const requests: { recipient: string; call: any }[] = [];
  mapping.forEach((streams, recipient) => {
    streams.forEach((stream) => {
      const method: keyof typeof abi = 'withdrawableAmountOf';
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

  /** Aggregate results from streams with the same recipient into individual withdrawable amounts */

  const amounts: Map<string, BigNumber> = new Map();
  mapping.forEach((_, recipient) => {
    amounts.set(recipient, BigNumber.from(0));
  });

  requests.forEach(({ recipient }, index) => {
    const amount = amounts.get(recipient);
    const additional = results[index].toString();

    const total = (amount || BigNumber.from(0)).add(BigNumber.from(additional));
    amounts.set(recipient, total);
  });

  return { amounts };
}

/**
 * Use the deposited amount from the subgraph query (getRecipientStreams).
 *
 * @returns Full amounts of initially deposited funds (by senders) for each recipient and every stream.
 */

async function getRecipientDepositedAmounts(mapping: IAccountMap) {
  const amounts: Map<string, BigNumber> = new Map();
  mapping.forEach((_, recipient) => {
    amounts.set(recipient, BigNumber.from(0));
  });

  mapping.forEach((streams, recipient) => {
    streams.forEach((stream) => {
      const deposited = BigNumber.from(stream.deposited);
      if (amounts.has(recipient)) {
        const total = amounts.get(recipient) || BigNumber.from(0);
        amounts.set(recipient, total.add(deposited));
      }
    });
  });

  return { amounts };
}

/**
 * Use the deposited amount from the subgraph query (getSenderStreams).
 *
 * @returns Full amounts of initially deposited funds (by senders) for each sender and every stream.
 */

async function getSenderDepositedAmounts(mapping: IAccountMap) {
  const amounts: Map<string, BigNumber> = new Map();
  mapping.forEach((_, sender) => {
    amounts.set(sender, BigNumber.from(0));
  });

  mapping.forEach((streams, sender) => {
    streams.forEach((stream) => {
      const deposited = BigNumber.from(stream.deposited);
      if (amounts.has(sender)) {
        const total = amounts.get(sender) || BigNumber.from(0);
        amounts.set(sender, total.add(deposited));
      }
    });
  });

  return { amounts };
}

/**
 * Query the blockchain for streamed amounts found in the uncanceled streams.
 * Use the deposited amount from the subgraph query (getRecipientStreams).
 *
 * @returns Full amounts made up of unstreamed assets (deposited - streamed) for each recipient and every stream.
 */
async function getRecipientUnstreamedAmounts(
  mapping: IAccountMap,
  setup: {
    block: number;
    network: string;
    provider: StaticJsonRpcProvider;
  }
) {
  const { block, network, provider } = setup;

  const requests: { recipient: string; deposited: string; call: any }[] = [];
  mapping.forEach((streams, recipient) => {
    streams.forEach((stream) => {
      /** Canceled streams will not count here, so skip them */
      if (!stream.canceled) {
        const method: keyof typeof abi = 'streamedAmountOf';
        const call = [stream.contract.toLowerCase(), method, [stream.id]];
        requests.push({ recipient, deposited: stream.deposited, call });
      }
    });
  });

  const results = await multicall(
    network,
    provider,
    Object.values(abi),
    requests.map((item) => item.call),
    { blockTag: block }
  );

  /** Aggregate results from streams with the same recipient into individual unstreamed amounts */

  const amounts: Map<string, BigNumber> = new Map();
  mapping.forEach((_, recipient) => {
    amounts.set(recipient, BigNumber.from(0));
  });

  requests.forEach(({ recipient }, index) => {
    const amount = amounts.get(recipient);

    const streamed = results[index].toString();
    const deposited = requests[index].deposited;

    const additional = BigNumber.from(deposited).sub(BigNumber.from(streamed));
    const total = (amount || BigNumber.from(0)).add(additional);

    amounts.set(recipient, total);
  });

  return { amounts };
}

/**
 * Query the blockchain for withdrawable amounts found in the canceled streams.
 * Use the deposited and withdrawn amounts from the subgraph query (getRecipientStreams).
 *
 * Tip: in active streams, reserved = unstreamed + withdrawable === deposited - withdrawn. In canceled, reserved = withdrawable.
 *
 * @returns Full amounts made up of reserved (unstreamed + withdrawable) assets for each recipient and every stream.
 */
async function getRecipientReservedAmounts(
  mapping: IAccountMap,
  setup: {
    block: number;
    network: string;
    provider: StaticJsonRpcProvider;
  }
) {
  /**
   * Break results into canceled streams and active ones.
   * For canceled streams look for withdrawable amounts (the final recipient withdraw).
   * For active streams, look for reserved amounts as `deposited - withdrawn`.
   */

  const mapping_active: IAccountMap = new Map();
  const mapping_canceled: IAccountMap = new Map();

  mapping.forEach((streams, recipient) => {
    mapping_active.set(recipient, []);
    mapping_canceled.set(recipient, []);

    streams.forEach((stream) => {
      if (stream.canceled) {
        mapping_canceled.set(recipient, [
          ...(mapping_canceled.get(recipient) || []),
          stream
        ]);
      } else {
        mapping_active.set(recipient, [
          ...(mapping_active.get(recipient) || []),
          stream
        ]);
      }
    });
  });

  /** Get withdrawable amounts for canceled streams */

  const { amounts: withdrawable } = await getRecipientWithdrawableAmounts(
    mapping_canceled,
    setup
  );

  /** Get reserved amounts for active streams (`deposited - withdrawn`) */

  const amounts: Map<string, BigNumber> = new Map();
  mapping.forEach((_, recipient) => {
    amounts.set(recipient, BigNumber.from(0));
  });

  mapping_active.forEach((streams, recipient) => {
    streams.forEach((stream) => {
      const deposited = BigNumber.from(stream.deposited);
      const withdrawn = BigNumber.from(stream.withdrawn);

      if (amounts.has(recipient)) {
        const total = amounts.get(recipient) || BigNumber.from(0);
        amounts.set(recipient, total.add(deposited.sub(withdrawn)));
      }
    });
  });

  /** Aggregate */

  withdrawable.forEach((withdrawable, recipient) => {
    const active = amounts.get(recipient) || BigNumber.from(0);
    amounts.set(recipient, active.add(withdrawable));
  });

  return { amounts };
}

async function getLatestBlock(
  network: string,
  provider: StaticJsonRpcProvider,
  snapshot: number | 'latest'
): Promise<number> {
  try {
    /** For clear numeric snapshots, assume the user picked the number on purpose */
    if (typeof snapshot === 'number') {
      return snapshot;
    }

    if (snapshot === 'latest') {
      const endpoint = deployments[network].subgraph;
      const name = endpoint.split('/subgraphs/name/')[1];
      const url = new URL('https://api.thegraph.com/index-node/graphql');

      const query = `{indexingStatusForCurrentVersion(subgraphName: \"${name}\"){ chains { latestBlock { number }}}}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        credentials: 'omit'
      });

      const { data } = await response.json();
      const block = data.indexingStatusForCurrentVersion.chains[0].latestBlock;
      const result = Number(block.number);

      console.log('=== SABLIER V2 ===');
      console.log(`Fetched latest subgraph indexed block at {${result}}`);

      return result;
    }
  } catch (error) {
    console.error(error);
  }

  return await provider.getBlockNumber();
}

export {
  getLatestBlock,
  getRecipientDepositedAmounts,
  getRecipientReservedAmounts,
  getRecipientStreams,
  getRecipientStreamedAmounts,
  getRecipientUnstreamedAmounts,
  getRecipientWithdrawableAmounts,
  getSenderDepositedAmounts,
  getSenderStreams
};
