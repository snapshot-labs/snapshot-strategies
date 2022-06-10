import { multicall } from '../../utils';
import snapshots from '@snapshot-labs/snapshot.js';

export const author = 'victor-kyriazakos';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) public view returns (address owner)'
];

// flattens the [{ "id": weight }] array into {ids[], weights[]} array
const flattenTokenIdWeightMetadata = (
  tokenIdWeightMetadata: []
): { ids: number[]; weights: number[] } => {
  const tokenData = tokenIdWeightMetadata.map((tokenDato) => {
    var ids: number[] = [], weights: number[] = [], datoId;
    const keys = Object.keys(tokenDato);
    if(keys.length > 0) {
      datoId = parseInt(keys[0]);
      ids.push(datoId);
      weights = [tokenDato[datoId.toString()]];
    }
    return { ids, weights};
  })

  return tokenData.reduce((prev, curr) => ({
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
  //const { tokenIdWeightRanges, defaultWeight } = options;
  const maximumNumberOfBatches = 4;
  const batchSize = 8000;
  const maximumAllowedRange = maximumNumberOfBatches * batchSize;
  let erc721WeightedBalance = {};
  let customRangeBalance = {};

  // 1st, get all metadata values from the source - token weights
  const metadata = await snapshots.utils.getJSON(options.metadataSrc);

  if (metadata.length > maximumAllowedRange)
    throw new Error(
      `Range is too big, the maximum allowed combined range is ${maximumAllowedRange}`
    );

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
    
    // Define contract calls
    const contractCalls = ids.map((id: number) => [
      options.address,
      'ownerOf',
      [id]
    ]) as [string, string, [number]][];

    // batch-call contract data
    const customRangeResponse = await getDataFromBlockChain(contractCalls);
        const customRangeResponseWeighted = await multiplyOccurrencesByWeights(
      customRangeResponse,
      weights
    );

    const customRangeResponseWeightedFiltered = filterUnusedAddresses(
      customRangeResponseWeighted
    );

    console.log(customRangeResponseWeightedFiltered);

    return countAndAccumulateOccurrences(customRangeResponseWeightedFiltered);
  };

  const makeBatch = ({ batchSize }) => {
    const { ids, weights } = flattenTokenIdWeightMetadata(metadata);
    const batchedIds = [...Array(Math.ceil(ids.length / batchSize))].map(() =>
      ids.splice(0, batchSize)
    );
    const batchedWeights = [
      ...Array(Math.ceil(weights.length / batchSize))
    ].map(() => weights.splice(0, batchSize));
    const batches = batchedIds.map((e, i) => ({
      ids: e,
      weights: batchedWeights[i]
    }));
    console.log(batches);
    return batches;
  };

  const batches = makeBatch({ batchSize: batchSize });
  for (let i = 0; i < batches.length; i++) {
    await accumulateCustomRangeBalance({ ...batches[i] });
  }

  return { ...erc721WeightedBalance, ...customRangeBalance };
}
