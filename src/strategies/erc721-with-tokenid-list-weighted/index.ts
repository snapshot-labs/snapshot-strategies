import { multicall } from '../../utils';

export const author = 'paste';
export const version = '0.1.0';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)'
];

const flattenTokenIdWeightLists = (
  tokenIdWeightLists
): { ids: number[]; weights: number[] } => {
  const ranges = tokenIdWeightLists.map((tokenIdWeightRange) => {
    const { weight, ids } = tokenIdWeightRange;
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
  const { tokenIdWeightLists } = options;
  // const maximumNumberOfBatches = 4;
  const batchSize = 8000;
  // const maximumAllowedRange = maximumNumberOfBatches * batchSize;
  let customRangeBalance = {};

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

  const countAndAccumulateOccurrences = (array: string[]) =>
    (customRangeBalance = array.reduce(
      (prev, curr) => (prev[curr] ? ++prev[curr] : (prev[curr] = 1), prev),
      customRangeBalance
    ));

  const accumulateCustomRangeBalance = async ({
    ids,
    weights
  }): Promise<{
    [address: string]: number;
  }> => {
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

    return countAndAccumulateOccurrences(customRangeResponseWeightedFiltered);
  };

  const makeBatch = ({ batchSize }) => {
    const { ids, weights } = flattenTokenIdWeightLists(tokenIdWeightLists);
    const batchedIds = [...Array(Math.ceil(ids.length / batchSize))].map(() =>
      ids.splice(0, batchSize)
    );
    const batchedWeights = [
      ...Array(Math.ceil(weights.length / batchSize))
    ].map(() => weights.splice(0, batchSize));
    return batchedIds.map((e, i) => ({
      ids: e,
      weights: batchedWeights[i]
    }));
  };

  const batches = makeBatch({ batchSize: batchSize });
  for (let i = 0; i < batches.length; i++) {
    await accumulateCustomRangeBalance({ ...batches[i] });
  }

  return { ...customRangeBalance };
}
