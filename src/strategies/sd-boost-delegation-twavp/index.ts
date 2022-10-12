import { multicall } from '../../utils';

export const author = 'clement-ux';
export const version = '0.0.1';
export const dependOnOtherAddress = false;

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function working_supply() external view returns (uint256)',
  'function working_balances(address account) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Maximum of 5 multicall
  if (options.sampleStep > 5) {
    throw new Error('maximum of 5 call');
  }

  // About the blockList
  const av_blockEmission = options.avgBlockTime;
  const lastBlock = await provider.getBlockNumber();
  let blockTag = typeof snapshot === 'number' ? snapshot : lastBlock;
  const nbrsEmittedBlock = Math.floor(
    (options.sampleSize * 60 * 60 * 24) / av_blockEmission
  );
  const blockTagList: number[] = [];
  for (let i = 1; i < options.sampleStep + 1; i++) {
    blockTagList.push(
      blockTag -
        Math.floor(
          (nbrsEmittedBlock * (options.sampleStep - i)) / options.sampleStep
        )
    );
  }
  //console.log('Used block List: ', blockTagList);

  // Query
  const workingBalanceQuery = addresses.map((address: any) => [
    options.sdTokenGauge,
    'working_balances',
    [address]
  ]);

  const response: number[] = [];

  for (let i = 0; i < options.sampleStep; i++) {
    blockTag = blockTagList[i];
    response.push(
      await multicall(
        network,
        provider,
        abi,
        [
          [options.sdTokenGauge, 'working_supply'],
          [options.veToken, 'balanceOf', [options.liquidLocker]],
          ...workingBalanceQuery
        ],
        {
          blockTag
        }
      )
    );
  }

  // Constant
  // Get Working supply on the gauge
  const workingSupply = response[response.length - 1][0];
  const votingPowerLiquidLocker = response[response.length - 1][1];

  const averageWorkingBalance = Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        let sum = Number(0);
        //console.log(`==================${addresses[i]}==================`);
        for (let j = 0; j < response.length; j++) {
          sum += Number(response[j][i + 2]);
          //console.log(Number(response[j][i+2]))
        }
        //console.log("Adjusted Balance : ", sum/(response.length*10**options.decimals))
        return [addresses[i], sum / response.length];
      })
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Get votingPower : user voting power
        const votingPower =
          workingSupply > 0
            ? (averageWorkingBalance[addresses[i]] * votingPowerLiquidLocker) /
              (workingSupply * 10 ** options.decimals)
            : 0;
        return [addresses[i], votingPower];
      })
  );
}
