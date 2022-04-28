import { 
  ress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { multicall, subgraphRequest } from '../../utils';

export const author = 'dogsunchained';
export const version = '0.0.1';

const abi721or20 = [
  'function balanceOf(address account) external view returns (uint256)'
];

const SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/dogsunchained/dogs-unchained';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const NFT_VALUE = 1;

  const calls721: any[] = [];
  const calls20: any[] = [];
  addresses.forEach((address: any) => {
    calls721.push([options.steaks, 'balanceOf', [address]]);
    calls20.push([options.boom, 'balanceOf', [address]]);
  });

  const response721 = await multicall(network, provider, abi721or20, calls721, {
    blockTag
  });
  const response20 = await multicall(network, provider, abi721or20, calls20, {
    blockTag
  });

  const paginate = (skip, reverse = false, where = {}) => {
    const req = {
      __args: {
        first: 1000,
        skip,
        orderBy: 'id',
        orderDirection: reverse ? 'desc' : 'asc',
        where: where
      },
      owner: {
        id: true
      }
    };
    if (typeof snapshot === 'number')
      req.__args['block'] = { number: snapshot };
    return req;
  };

  const dogParams = {
    'd1:dogs': paginate(0, false, { burned: false }),
    'd2:dogs': paginate(1000, false, { burned: false }),
    'd3:dogs': paginate(2000, false, { burned: false }),
    'd4:dogs': paginate(3000, false, { burned: false }),
    'd5:dogs': paginate(4000, false, { burned: false }),
    'd6:dogs': paginate(0, true, { burned: false }),
    'd7:dogs': paginate(1000, true, { burned: false }),
    'd8:dogs': paginate(2000, true, { burned: false }),
    'd9:dogs': paginate(3000, true, { burned: false }),
    'd10:dogs': paginate(4000, true, { burned: false })
  };

  const dogsResult = await subgraphRequest(SUBGRAPH_URL, dogParams);

  const puppyParams = {
    'p1:puppies': paginate(0),
    'p2:puppies': paginate(1000),
    'p3:puppies': paginate(2000),
    'p4:puppies': paginate(3000),
    'p5:puppies': paginate(4000),
    'p6:puppies': paginate(0, true),
    'p7:puppies': paginate(1000, true),
    'p8:puppies': paginate(2000, true),
    'p9:puppies': paginate(3000, true),
    'p10:puppies': paginate(4000, true)
  };

  const puppiesResult = await subgraphRequest(SUBGRAPH_URL, puppyParams);

  const stakeParams = {
    'p1:stakes': paginate(0),
    'p2:stakes': paginate(1000),
    'p3:stakes': paginate(2000),
    'p4:stakes': paginate(3000),
    'p5:stakes': paginate(4000),
    'p6:stakes': paginate(0, true),
    'p7:stakes': paginate(1000, true),
    'p8:stakes': paginate(2000, true),
    'p9:stakes': paginate(3000, true),
    'p10:stakes': paginate(4000, true)
  };

  const stakesResult = await subgraphRequest(SUBGRAPH_URL, stakeParams);

  let totalBOOM = 0;
  let totalNFTs = 0;

  response20.map((value: any) => {
    totalBOOM += parseFloat(formatUnits(value.toString(), 18));
  });

  const merged = {};

  response721.map((value: any, i: number) => {
    const address = getAddress(calls721[i][2][0]);
    if (address == options.staking) return;
    merged[address] = (merged[address] || 0) as number;
    merged[address] += parseFloat(formatUnits(value.toString(), 0)) * NFT_VALUE;
    totalNFTs += parseFloat(formatUnits(value.toString(), 0)) * NFT_VALUE;
  });

  for (const key in dogsResult) {
    dogsResult[key].map((value: any) => {
      if (!value.owner) return;
      const address = getAddress(value.owner.id);
      merged[address] = (merged[address] || 0) as number;
      merged[address] += NFT_VALUE;
      totalNFTs += NFT_VALUE;
    });
  }

  for (const key in puppiesResult) {
    puppiesResult[key].map((value: any) => {
      if (!value.owner) return;
      const address = getAddress(value.owner.id);
      merged[address] = (merged[address] || 0) as number;
      merged[address] += NFT_VALUE;
      totalNFTs += NFT_VALUE;
    });
  }

  for (const key in stakesResult) {
    stakesResult[key].map((value: any) => {
      if (!value.owner) return;
      const address = getAddress(value.owner.id);
      merged[address] = (merged[address] || 0) as number;
      merged[address] += NFT_VALUE;
      totalNFTs += NFT_VALUE;
    });
  }

  const BOOM_TO_NFT = totalNFTs / totalBOOM;
  response20.map((value: any, i: number) => {
    const address = getAddress(calls20[i][2][0]);
    merged[address] = (merged[address] || 0) as number;
    merged[address] +=
      parseFloat(formatUnits(value.toString(), 18)) * BOOM_TO_NFT;
  });

  return merged;
}
