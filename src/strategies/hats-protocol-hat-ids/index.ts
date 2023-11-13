import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { multicall } from '../../utils';

export const author = 'hotmanics';
export const version = '1.0.0';

const abi = [
  'function isWearerOfHat(address _user, uint256 _hatId) external view returns (bool isWearer)'
];

async function subgraphRequestHats({ url, snapshot, treeIp }) {
  const treeHex = treeIdDecimalToHex(treeIp);

  const params = {
    tree: {
      __args: {
        id: treeHex
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

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  //This strategy currently enforces that all hatIds passed in are from the same tree.
  for (let i = 0; i < options.hatIds.length; i++) {
    const lhs = treeIpFromIp(options.hatIds[i]);

    for (let j = 0; j < options.hatIds.length; j++) {
      const rhs = treeIpFromIp(options.hatIds[j]);
      if (lhs !== rhs) {
        throw Error('You can only use hats from the same tree!');
      }
    }
  }

  //all hatIds are assumed to be from the same tree, set selectedTree to any, and continue.
  const selectedTree = treeIpFromIp(options.hatIds[0]);

  const request = {
    url: getActiveNetworkSubgraphURL(network),
    snapshot,
    treeIp: selectedTree
  };

  const result = await subgraphRequestHats(request);

  const validHats: any[] = [];

  for (let j = 0; j < options.hatIds.length; j++) {
    for (let i = 0; i < result.tree.hats.length; i++) {
      const hatIpHex = HatIpToHex(options.hatIds[j]);

      if (hatIpHex === result.tree.hats[i].id) {
        validHats.push(result.tree.hats[i]);
        break;
      }
    }
  }

  let wearersInAddresses = <any>[];

  addresses.forEach((address) => {
    const wearer = checkIfExists(address, validHats);
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

function getActiveNetworkSubgraphURL(network) {
  let url;

  switch (network) {
    case '1':
      url =
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-ethereum';
      break;
    case '10':
      url =
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-optimism';
      break;
    case '5':
      url =
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-goerli';
      break;
    case '137':
      url =
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-polygon';
      break;
    case '100':
      url =
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-gnosis-chain';
      break;
    case '42161':
      url =
        'https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-arbitrum';
      break;
  }

  return url;
}

function checkIfExists(address, hats) {
  const addressWithHats = <any>[];
  hats.forEach((hat) => {
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

function treeIdDecimalToHex(treeId: number): string {
  return '0x' + treeId.toString(16).padStart(8, '0');
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

function treeIpFromIp(hatIp) {
  let treeIp;

  if (hatIp.indexOf('.') === -1) treeIp = hatIp;
  else treeIp = hatIp.substring(0, hatIp.indexOf('.'));

  return Number(treeIp);
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
