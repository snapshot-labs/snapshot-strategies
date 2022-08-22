import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function balanceOf(address account, uint256 id) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Arbitrary limit to avoid memory issues
  const limit = 10;
  if (options.gloveAddresses.length > limit) {
    throw new Error(
      `Number of glove addresses ${options.gloveAddresses.length} exceeds limit ${limit}`
    );
  }
  if (options.weightClassIds.length > limit) {
    throw new Error(
      `Number of weight class IDs ${options.weightClassIds.length} exceeds limit ${limit}`
    );
  }

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  Object.entries(options.gloveAddresses).forEach(([gloveAddress]) => {
    addresses.forEach((address: string) => {
      multi.call(
        `${address}.gloves.${gloveAddress}`,
        gloveAddress,
        'balanceOf(address)',
        [address]
      );
    });
  });

  Object.entries(options.weightClassIds).forEach(([weightClassId]) => {
    addresses.forEach((address: string) => {
      multi.call(
        `${address}.weightClasses.${weightClassId}`,
        options.weightClassAddress,
        'balanceOf(address, uint256)',
        [address, weightClassId]
      );
    });
  });

  const result: Record<
    string,
    Record<string, Record<string, BigNumber>>
  > = await multi.execute();

  // console.log('Multicall result');
  // console.dir(result, { depth: null });

  const weightedResult: Record<
    string,
    Record<string, Record<string, number>>
  > = Object.fromEntries(
    addresses.map((address: string) => [
      address,
      {
        gloves: Object.fromEntries(
          Object.entries(result[address].gloves).map(
            ([gloveAddress, numGloves]) => {
              const hasGlove = numGloves.gte(1) ? 1 : 0;
              return [
                gloveAddress,
                hasGlove * options.gloveAddresses[gloveAddress]
              ];
            }
          )
        ),
        weightClasses: Object.fromEntries(
          Object.entries(result[address].weightClasses).map(
            ([weightClassId, numKudos]) => {
              const hasKudo = numKudos.gte(1) ? 1 : 0;
              return [
                weightClassId,
                hasKudo * options.weightClassIds[weightClassId]
              ];
            }
          )
        )
      }
    ])
  );

  // console.log('Weighted result');
  // console.dir(weightedResult, { depth: null });

  return Object.fromEntries(
    addresses.map((address: string) => {
      // Only the glove with the highest associated weight is counted.
      // Total vote score is 0 if voter has no gloves.
      const maxGlove = Math.max(
        ...Object.values(weightedResult[address].gloves)
      );
      // Only the weight class Kudo with the highest associated weight is counted.
      // Weight class multiplier defaults to 1 if voter has no weight class Kudos.
      const maxWeightClass =
        Math.max(...Object.values(weightedResult[address].weightClasses)) || 1;
      return [address, maxGlove * maxWeightClass];
    })
  );
}
