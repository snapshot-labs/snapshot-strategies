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

/**
 * Query the subgraph for all the streams owned by all (or a given set of) recipients.
 *
 * @returns A mapping from each recipient to their list of owned streams.
 */
async function getRecipientStreams(
  recipients: string[] | undefined,
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
      accounts: recipients?.map((item) => item.toLowerCase()),
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

    if (streams && list.length) {
      list.forEach((item) => {
        const recipient = item.recipient.toLowerCase();
        const entry = {
          id: item.tokenId,
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
 * Query the subgraph for all the streams started by all (or a given set of) senders.
 *
 * @returns A mapping from each sender to their list of started streams.
 */
async function getSenderStreams(
  senders: string[] | undefined,
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
      accounts: senders?.map((item) => item.toLowerCase()),
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

    if (streams && list.length) {
      list.forEach((item) => {
        const sender = item.sender.toLowerCase();
        const entry = {
          id: item.tokenId,
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
 * Query the blockchain for streamed amounts for every stream and each recipient.
 *
 * @returns Full amounts made up of streamed amounts for each recipient (from all owned streams).
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

  const amounts: Map<string, BigNumber> = new Map();
  mapping.forEach((_, recipient) => {
    amounts.set(recipient, BigNumber.from(0));
  });

  requests.forEach(({ recipient }, index) => {
    const amount = amounts.get(recipient);
    const additional = results[index].toString();

    const total = amount
      ? amount?.add(BigNumber.from(additional))
      : BigNumber.from(0);

    amounts.set(recipient, total);
  });

  return amounts;
}

/**
 * Use the withdrawn amount from the subgraph query (getRecipientAmounts).
 * Use the streamed amount from the blockchain query (getStreamedAmount).
 * Obtain an withdrawable amount from `streamed - withdrawn`.
 *
 * @returns Full amounts of withdrawable funds for each recipient (from all owned streams)
 */

async function getRecipientWithdrawableAmounts(
  mapping: IAccountMap,
  setup: {
    block: number;
    network: string;
    provider: StaticJsonRpcProvider;
  }
) {
  const amounts = await getRecipientStreamedAmounts(mapping, setup);

  mapping.forEach((streams, recipient) => {
    streams.forEach((stream) => {
      const withdrawn = BigNumber.from(stream.withdrawn);
      if (amounts.has(recipient)) {
        const streamed = amounts.get(recipient) || BigNumber.from(0);
        const withdrawable = streamed.sub(withdrawn);
        amounts.set(recipient, withdrawable);
      }
    });
  });

  return amounts;
}

/**
 * Use the deposited amount from the subgraph query (getRecipientStreams).
 *
 * @returns Full amounts of initially deposited funds (by senders) for each recipient (from all owned streams)
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

  return amounts;
}

/**
 * Use the deposited amount from the subgraph query (getSenderStreams).
 *
 * @returns Full amounts of initially deposited funds (by senders) for each recipient (from all owned streams)
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

  return amounts;
}

export {
  getRecipientStreams,
  getRecipientStreamedAmounts,
  getRecipientDepositedAmounts,
  getRecipientWithdrawableAmounts,
  getSenderStreams,
  getSenderDepositedAmounts
};
