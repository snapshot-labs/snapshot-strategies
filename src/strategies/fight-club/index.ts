import { BigNumber } from '@ethersproject/bignumber';
// import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function balanceOf(address account, uint256 id) external view returns (uint256)',
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
      multi.call(`${address}.gloves.${gloveAddress}`, gloveAddress, 'balanceOf(address)', [address]);
    })
  });
  Object.entries(options.weightClassTokenIds).forEach(([weightClassId]) => {
    addresses.forEach((address: string) => {
      multi.call(`${address}.weightClasses.${weightClassId}`, options.weightClassAddress, 'balanceOf(address, uint256)', [address, weightClassId]);
    })
  });

  const result: Record<string, Record<string, Record<string, BigNumber>>> = await multi.execute();

  const weightedResult: Record<string, Record<string, Record<string, BigNumber>>> = Object.fromEntries(
    addresses.map((address: string) => [
      address,
      Object.fromEntries([
        ['gloves', Object.entries(result[address].gloves).map(([gloveAddress, numGloves]) => [
          gloveAddress,
          numGloves.mul(options.gloves[gloveAddress])
        ])],
        ['weightedClasses', Object.entries(result[address].weightClasses).map(([weightClassId, numKudos]) => [
          weightClassId,
          numKudos.mul(options.weightClassTokenIds[weightClassId])
        ])]
      ])
    ])
  );

  const address = '0x1EC1CcEF3e1735bdA3F4BA698e8a524AA7c93274';
  console.log("weightedResult",weightedResult);
  console.log("weightedResult.gloves", weightedResult[address].gloves);
  console.log("weightedResult.gloves", weightedResult[address].weightClasses);

  addresses.forEach((address: string) => {
    Object.entries(weightedResult[address].gloves).forEach(([gloveAddress, numGloves]) => {
      console.log('address',address,'gloveAddress',gloveAddress,'numGloves',numGloves);
    });
    Object.entries(weightedResult[address].weightClasses).forEach(([weightClassId, numKudos]) => {
      console.log('address',address,'weightClassId',weightClassId,'numKudos',numKudos);
    });
  });

  return Object.fromEntries(
    addresses.map((address: string) => {
      const gloveWeights = Object.values(result[address].gloves).map((gloveWeight) => [
        gloveWeight.toNumber()
      ])
      console.log('gloveWeights',gloveWeights);
      return [address, 2]
    })
      // parseFloat(formatUnits(result[address].gloves, options.decimals))
  );
}
