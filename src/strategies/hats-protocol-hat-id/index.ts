import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'hotmanics';
export const version = '1.0.0';

async function subgraphRequestHats(url, snapshot, hatIp) {
  const hatHex = HatIpToHex(hatIp);

  const params = {
    hat: {
      __args: {
        id: hatHex
      },
      id: true,
      wearers: {
        id: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.hat.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(url, params);
  return result;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  let result;

  switch (network) {
    case '1':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-ethereum',
        snapshot,
        options.hatId
      );
      break;
    case '10':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-optimism',
        snapshot,
        options.hatId
      );
      break;
    case '5':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-goerli',
        snapshot,
        options.hatId
      );
      break;
    case '137':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-polygon',
        snapshot,
        options.hatId
      );
      break;
    case '100':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-gnosis-chain',
        snapshot,
        options.hatId
      );
      break;
    case '42161':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-arbitrum',
        snapshot,
        options.hatId
      );
      break;
  }

  const myObj = {};

  addresses.forEach((address) => {
    myObj[address] = 0;

    for (let i = 0; i < result.hat.wearers.length; i++) {
      if (address === getAddress(result.hat.wearers[i].id)) {
        myObj[address] = 1;
        break;
      }
    }
  });

  return myObj;
}

function HatIpToHex(hatIp) {
  let observedChunk = hatIp;

  const sections: number[] = [];

  while (true) {
    if (observedChunk.indexOf('.') === -1) {
      const section = observedChunk.substring(0, observedChunk.length);
      sections.push(Number(section));
      break;
    }

    const section = observedChunk.substring(0, observedChunk.indexOf('.'));
    observedChunk = observedChunk.substring(
      observedChunk.indexOf('.') + 1,
      observedChunk.length
    );

    sections.push(Number(section));
  }

  let constructedResult = '0x';

  for (let i = 0; i < sections.length; i++) {
    const hex = sections[i].toString(16);

    if (i === 0) {
      constructedResult += hex.padStart(10 - hex.length, '0');
    } else {
      constructedResult += hex.padStart(5 - hex.length, '0');
    }
  }

  constructedResult = constructedResult.padEnd(66, '0');
  return constructedResult;
}
