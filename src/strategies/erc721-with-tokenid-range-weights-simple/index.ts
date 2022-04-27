import { strategy as erc721WithMultiplier } from '../erc721-with-multiplier';
import { multicall } from '../../utils';
import { WeightRange } from './types';

export const author = 'FeSens';
export const version = '0.2.0';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)',
  'function balanceOf(address account) external view returns (uint256)'
];

const range = (start, end, step) =>
  Array.from({ length: (end - start) / step + 1 }, (_, i) => start + i * step);

const flattenTokenIdWeightRanges = (
  tokenIdWeightRanges: WeightRange[]
): { ids: number[]; weights: number[] } => {
  const ranges = tokenIdWeightRanges.map((tokenIdWeightRange) => {
    const { start, end, weight } = tokenIdWeightRange;
    const ids = range(start, end, 1);
    const weights = Array(ids.length).fill(weight);

    return { ids, weights };
  });

  return ranges.reduce((prev, curr) => ({
    ids: [...prev.ids, ...curr.ids],
    weights: [...prev.weights, ...curr.weights]
  }));
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const { tokenIdWeightRanges, defaultWeight } = options;
  let erc721WeightedBalance = {};

  const getDataFromBlockChain = async (
    contractCalls: [string, string, [number]][]
  ) => multicall(network, provider, abi, contractCalls, { blockTag });

  const filterUnusedAddresses = (addressesToFilter: string[]): string[] =>
    addressesToFilter.filter((address: string) =>
      addresses
        .map((address: string) => address.toLowerCase())
        .includes(address.toLowerCase())
    );

  const multiplyOccurrencesByWeights = async (
    contractCallResponse: [string, { owner: string }],
    weights: number[]
  ) =>
    contractCallResponse
      .map((address, index) => Array(weights[index]).fill(address[0]))
      .flat();

  const countOccurrences = (array: string[]) =>
    array.reduce(
      (prev, curr) => (prev[curr] ? ++prev[curr] : (prev[curr] = 1), prev),
      {}
    );

  const getCustomRangeBalance = async (): Promise<{
    [address: string]: number;
  }> => {
    const { ids, weights } = flattenTokenIdWeightRanges(tokenIdWeightRanges);
    const contractCalls = ids.map((id: number) => [
      options.address,
      'ownerOf',
      [id]
    ]) as [string, string, [number]][];
    const customRangeResponse = await getDataFromBlockChain(contractCalls);
    const customRangeResponseWeighted = await multiplyOccurrencesByWeights(
      customRangeResponse,
      weights
    );
    const customRangeResponseWeightedFiltered = filterUnusedAddresses(
      customRangeResponseWeighted
    );

    return countOccurrences(customRangeResponseWeightedFiltered);
  };

  if (defaultWeight)
    erc721WeightedBalance = await erc721WithMultiplier(
      space,
      network,
      provider,
      addresses,
      { ...options, multiplier: defaultWeight },
      snapshot
    );

  const customRangeBalance = await getCustomRangeBalance();

  return { ...erc721WeightedBalance, ...customRangeBalance };
}
