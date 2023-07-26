import { deployments, queries, page } from './configuration';
import type {
  IOptions,
  IStreamByAssetParams,
  IStreamByAssetResult
} from './configuration';
import { subgraphRequest } from '../../utils';

async function getRecipientStreams(
  network: string,
  recipients: string[] | undefined,
  options: IOptions,
  block: number
) {
  const endpoint = deployments[network].subgraph;

  /** Mapping recipients to the streams they own */
  const streams: Map<string, { id: string; contract: string }[]> = new Map();
  if (recipients && !options.isGlobal) {
    recipients.forEach((address) => {
      streams.set(address.toLowerCase(), []);
    });
  }

  let skip = 0;
  while (true) {
    const params: IStreamByAssetParams = {
      recipients: options.isGlobal
        ? undefined
        : recipients?.map((item) => item.toLowerCase()),
      block,
      asset: options.address.toLowerCase(),
      first: page,
      skip: skip * page
    };

    const results = (await subgraphRequest(
      endpoint,
      queries.StreamByAsset(params)
    )) as IStreamByAssetResult;

    const list = results?.streams;

    if (streams && list.length) {
      list.forEach((item) => {
        const recipient = item.recipient.toLowerCase();
        const entry = {
          id: item.tokenId,
          contract: item.contract.id
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

export { getRecipientStreams };
