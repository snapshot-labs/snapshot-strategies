import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

export const author = 'drgorillamd';
export const version = '1.0.0';

const kawaFarmAddress = '0xC68844Cd3BA9d3Ad88F2cC278213F64b8C0bCddf';

const kawaFarmAbi = ['function getPoolCount() external view returns(uint256)',
'function pendingRewards(uint256,address) external view returns(uint256)',
'function userInfo(address,uint256) external view returns(uint256,uint256,uint256,uint256)'];

const getNumberOfPools = async (
    provider: Provider,
    snapshot: number | string
  ) => {
    const kawaFarm = new Contract(
      kawaFarmAddress,
      kawaFarmAbi,
      provider
    );
  
    const farmCount:BigNumberish = await kawaFarm.getPoolCount({
      blockTag: snapshot
    });
  
    return farmCount;
  };

export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  ): Promise<Record<string, number>> {

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, kawaFarmAbi, { blockTag });
  const pools = await getNumberOfPools(provider, snapshot);

  let promises = [];

  new Array(pools).fill(0).forEach((_, poolId) => {

    addresses.forEach((address) => {
      multi.call(address, kawaFarmAddress, 'userInfo', [address, poolId]),
      multi.call(address, kawaFarmAddress, 'pendingRewards', [poolId, address])
    });



  });

  const result: Record<string, BigNumberish> = await multi.execute();

  console.log(result);
/*
  return result.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }

      finalResults[address] += value;
    }

    return finalResults;
  }, {});


*/

return Object.fromEntries(
  Object.entries(result).map(([address, balance]) => [
    address,
    parseFloat(formatUnits(balance, options.decimals))
  ])
);

}