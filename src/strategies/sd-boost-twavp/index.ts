import { multicall } from '../../utils';

export const author = 'clement-ux';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function working_supply() external view returns (uint256)'
];

const veSDT = '0x0C30476f66034E11782938DF8e4384970B6c9e8a';

const F1 = 0.4;
const F2 = 0.6;

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

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
  const veSDTBalanceQuery = addresses.map((address: any) => [
    veSDT,
    'balanceOf',
    [address]
  ]);
  const sdTokenBalanceQuery = addresses.map((address: any) => [
    options.gauge,
    'balanceOf',
    [address]
  ]);
  const responseBlockRef = await multicall(
    network,
    provider,
    abi,
    [
      [options.veToken, 'balanceOf', [options.lockerToken]],
      [veSDT, 'totalSupply'],
      [options.gauge, 'totalSupply'],
      [options.gauge, 'working_supply'],
      ...veSDTBalanceQuery,
      ...sdTokenBalanceQuery
    ],
    {
      blockTag
    }
  );
  const responseOtherBlock: number[] = [];
  for (let i = options.sampleStep - 1; i > 0; i--) {
    blockTag = blockTagList[i - 1];
    responseOtherBlock.push(
      await multicall(network, provider, abi, [...sdTokenBalanceQuery], {
        blockTag
      })
    );
  }

  // Constant
  // Get LLVotingPower : total Liquid Locker voting power
  const LLVotingPower = responseBlockRef[0];
  // Get veSDTSupply : total veSDT supply
  const veSDTSupply = responseBlockRef[1];
  // Get gaugeSupply : total balance of staked sdToken
  const gaugeSupply = responseBlockRef[2];
  // Get Working supply on the gauge
  const workingSupply = responseBlockRef[3];

  const responseClean = responseBlockRef.slice(4, responseBlockRef.length);
  const chunks = chunk(responseClean, addresses.length);

  // Variable per address
  // Get veSDTBalance : user veSDT balance
  const veSDTBalance = chunks[0];
  // Get sdTokenBalance : user balance of staked sdToken
  const sdTokenBalance = chunks[1];
  //console.log(sdTokenBalance)

  // Get adjustedBalance = user adjusted balance of staked sdToken
  const adjustedBalance = Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const veSDTRatio = veSDTBalance[i][0] / veSDTSupply[0];
        // Address : RefBlock : Value
        //console.log(
        //  addresses[i],
        //  'block: ',
        //  blockTagList[blockTagList.length - 1],
        //  'value: ',
        //  Number(sdTokenBalance[i])
        //);
        let sumSdTokenBalance = Number(sdTokenBalance[i]);
        for (let j = 0; j < options.sampleStep - 1; j++) {
          // Address : Block : Value
          //console.log(
          //  addresses[i],
          //  'block: ',
          //  blockTagList[options.sampleStep - 2 - j],
          //  'value: ',
          //  Number(responseOtherBlock[j][i])
          //);
          sumSdTokenBalance += Number(responseOtherBlock[j][i]);
        }
        const avgSdTokenBalance = sumSdTokenBalance / options.sampleStep;
        //console.log(addresses[i]," average sdToken Balance",avgSdTokenBalance);
        const derived_i =
          avgSdTokenBalance * F1 + gaugeSupply * veSDTRatio * F2;
        const adjustedBalance_i = Math.min(derived_i, avgSdTokenBalance);

        // Print statements variable per address
        //console.log(`==================${addresses[i]}==================`);
        //console.log(
        //  'Balance veSDT: ',
        //  (veSDTBalance[i][0] / 10 ** DECIMALS).toString()
        //);
        //console.log(
        //  'Ratio balance/supply veSDT: ',
        //  (veSDTRatio * 100).toString(),
        //  '%'
        //);
        //console.log(
        //  'Calcul inside adjusted balance: ',
        //  (derived_i / 10 ** DECIMALS).toString()
        //);
        //console.log(
        //  'AdjustedBalance: ',
        //  (adjustedBalance_i / 10 ** DECIMALS).toString()
        //);
        //console.log(
        //  'LLVotingPower: ',
        //  (LLVotingPower / 10 ** DECIMALS).toString()
        //);
        //console.log('veSDTSupply: ', (veSDTSupply / 10 ** DECIMALS).toString());
        //console.log('gaugeSupply: ', (gaugeSupply / 10 ** DECIMALS).toString());
        //console.log(
        //  'Working Supply: ',
        //  (workingSupply / 10 ** DECIMALS).toString()
        //);
        // console.log(``);```
        return [addresses[i], adjustedBalance_i / 10 ** options.decimals];
      })
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Get votingPower : user voting power
        const votingPower =
          workingSupply > 0
            ? (adjustedBalance[addresses[i]] * LLVotingPower) / workingSupply
            : 0;
        return [addresses[i], votingPower];
      })
  );
}
