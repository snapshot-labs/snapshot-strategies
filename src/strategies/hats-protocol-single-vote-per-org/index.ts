import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { multicall } from '../../utils';

export const author = 'hotmanics';
export const version = '0.1.1';

const abi = [
  'function isWearerOfHat(address _user, uint256 _hatId) external view returns (bool isWearer)'
];

async function subgraphRequestHats(url, snapshot, humanReadableTreeId) {
  const str1 = '0x';
  const length = humanReadableTreeId.toString().length;
  let resultString = str1.padEnd(10 - length, '0');
  resultString = resultString + humanReadableTreeId.toString();

  const params = {
    tree: {
      __args: {
        id: resultString
      },
      id: true,
      hats: {
        id: true,
        wearers: {
          id: true
        }
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.tree.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(url, params);
  return result;
}

function checkIfExists(address, tree) {
  const addressWithHats = <any>[];
  tree.hats.forEach((hat) => {
    hat.wearers.forEach((wearer) => {
      if (getAddress(wearer.id) === address) {
        const addressWithHat = {
          address: getAddress(wearer.id),
          hat: BigInt(hat.id)
        };
        addressWithHats.push(addressWithHat);
      }
    });
  });
  return addressWithHats;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  let result;

  switch (network) {
    case '1':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-ethereum',
        snapshot,
        options.humanReadableTreeId
      );
      break;
    case '10':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-optimism',
        snapshot,
        options.humanReadableTreeId
      );
      break;
    case '5':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-goerli',
        snapshot,
        options.humanReadableTreeId
      );
      break;
    case '137':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-polygon',
        snapshot,
        options.humanReadableTreeId
      );
      break;
    case '100':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-gnosis-chain',
        snapshot,
        options.humanReadableTreeId
      );
      break;
    case '42161':
      result = await subgraphRequestHats(
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-arbitrum',
        snapshot,
        options.humanReadableTreeId
      );
      break;
  }

  let wearersInAddresses = <any>[];

  addresses.forEach((address) => {
    const wearer = checkIfExists(address, result.tree);
    wearersInAddresses = wearersInAddresses.concat(wearer);
  });

  const multi = new Multicaller(network, provider, abi, { blockTag });

  wearersInAddresses.forEach((wearer) => {
    multi.call(wearer.address, options.address, 'isWearerOfHat', [
      wearer.address,
      wearer.hat
    ]);
  });

  const multiResult = await multi.execute();

  const myObj = {};
  wearersInAddresses.forEach((wearer) => {
    myObj[wearer.address] = 0;
    for (const result of multiResult) {
      if (wearer.address === result.address) {
        myObj[wearer.address] = 1;
        break;
      }
    }
  });

  return myObj;
}

class Multicaller {
  public network: string;
  public provider: StaticJsonRpcProvider;
  public abi: any[];
  public options: any = {};
  public calls: any[] = [];
  public paths: any[] = [];

  constructor(
    network: string,
    provider: StaticJsonRpcProvider,
    abi: any[],
    options?
  ) {
    this.network = network;
    this.provider = provider;
    this.abi = abi;
    this.options = options || {};
  }

  call(path, address, fn, params?): Multicaller {
    this.calls.push([address, fn, params]);
    this.paths.push(path);
    return this;
  }

  async execute(): Promise<any> {
    const obj = <any>[];
    const result = await multicall(
      this.network,
      this.provider,
      this.abi,
      this.calls,
      this.options
    );
    result.forEach((r, i) => {
      obj.push({
        address: this.paths[i],
        value: r
      });
    });
    this.calls = [];
    this.paths = [];
    return obj;
  }
}
