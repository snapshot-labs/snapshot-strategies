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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  Object.entries(options.gloves).forEach(([gloveAddress]) => {
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

  // Log result
  console.dir(result, { depth: null });

  const weightedResult: Record<
    string,
    Record<string, Record<string, number>>
  > = Object.fromEntries(
    addresses.map((address: string) => [
      address,
      {
        gloves: Object.fromEntries(
          Object.entries(result[address].gloves).map(
            ([gloveAddress, numGloves]) => [
              gloveAddress,
              numGloves.mul(options.gloves[gloveAddress]).toNumber()
            ]
          )
        ),
        weightClasses: Object.fromEntries(
          Object.entries(result[address].weightClasses).map(
            ([weightClassId, numKudos]) => [
              weightClassId,
              numKudos.mul(options.weightClassIds[weightClassId]).toNumber()
            ]
          )
        )
      }
    ])
  );

  // Log weightedResult
  console.dir(weightedResult, { depth: null });

  return Object.fromEntries(
    addresses.map((address: string) => [
      address,
      Math.max(...Object.values(weightedResult[address].gloves)) *
        Math.max(...Object.values(weightedResult[address].weightClasses))
    ])
  );
}
