//import { multicall } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'clement-ux';
export const version = '0.0.3';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function working_supply() external view returns (uint256)'
];

const veSDT = '0x0C30476f66034E11782938DF8e4384970B6c9e8a';

const F1 = 0.4;
const F2 = 0.6;
const av_blockEmission = 12; // in secs

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

  /* ==== BlockTag ==== */
  const lastBlock = await provider.getBlockNumber()
  let blockTag = typeof snapshot === 'number' ? snapshot : lastBlock-10;

  const nbrsEmittedBlock =
    Math.floor((options.sampleSize * 60 * 60 * 24) / av_blockEmission);
  
  let blockTagList: number[] = [];
  for (let i = 0; i < options.sampleStep; i++) {
    blockTagList.push(blockTag - (nbrsEmittedBlock * (options.sampleStep - i)) / options.sampleStep)
  }
  //console.log("Used block List: ", blockTagList)


  /* ==== Query ==== */
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

  /* ==== Call ==== */
  const response = await fetch(options.api, {
    method: "POST",
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      blocks: [blockTag],
      abi: abi,
      data: [
        [options.veToken, 'balanceOf', [options.lockerToken]],
        [veSDT, 'totalSupply'],
        [options.gauge, 'totalSupply'],
        [options.gauge, 'working_supply'],
        ...veSDTBalanceQuery
      ]
    })
  })

  const responsesdToken = await fetch(options.api, {
    method: "POST",
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      blocks: blockTagList,
      abi: abi,
      data: [
        ...sdTokenBalanceQuery
      ]
    })
  })
  const data = await response.json()
  const datasd = await responsesdToken.json()


  /* ==== Constant ==== */
  // Get LLVotingPower : total Liquid Locker voting power
  const LLVotingPower = parseInt(data[blockTag][0][0].hex);
  // Get veSDTSupply : total veSDT supply
  const veSDTSupply = parseInt(data[blockTag][1][0].hex);
  // Get gaugeSupply : total balance of staked sdToken
  const gaugeSupply = parseInt(data[blockTag][2][0].hex);
  // Get Working supply on the gauge
  const workingSupply = parseInt(data[blockTag][3][0].hex);

  /* ==== Display constant ==== */
  //console.log(
  //  'LLVotingPower: \t', (LLVotingPower / 10 ** 18));
  //console.log('veSDTSupply: \t', (veSDTSupply / 10 ** 18));
  //console.log('gaugeSupply: \t', (gaugeSupply / 10 ** 18));
  //console.log('workingSupply: \t', (workingSupply / 10 ** 18));

  const responseClean = data[blockTag].slice(4, data[blockTag].length);
  const chunks = chunk(responseClean, addresses.length);

  /* ==== Variables per addresses ==== */
  // Get veSDTBalance: user veSDT balance
  const veSDTBalance = chunks[0];

  // Get adjustedBalance = user adjusted balance of staked sdToken
  const adjustedBalance = Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {

        const veSDTBalance_i = parseInt(veSDTBalance[i][0].hex);
        let buffer = 0;
        let avg_sdToken_array_i: any[] = [] // Only for checking
        for (let j = 0; j < blockTagList.length; j++) {
          let newValue = { block: blockTagList[j], value: parseInt(datasd[blockTagList[j]][i][0].hex) / (10 ** 18) }
          avg_sdToken_array_i.push(newValue)
          buffer += parseInt(datasd[blockTagList[j]][i][0].hex)
        }
        const last_sdToken_i = parseInt(datasd[blockTagList[blockTagList.length-1]][i][0].hex)
        const avg_sdToken_i = buffer / blockTagList.length;
        const adjusted_avg_sdToken_i = Math.min(avg_sdToken_i, last_sdToken_i)
        const veSDTRatio_i = veSDTBalance_i / veSDTSupply;
        const derived_i = adjusted_avg_sdToken_i * F1 + gaugeSupply * veSDTRatio_i * F2
        const adjustedBalance_i = Math.min(derived_i, adjusted_avg_sdToken_i);

        /* ==== Print statements variable per address ==== */
        // console.log(`==================${addresses[i]}==================`);
        // console.log("sdToken at different block: ", avg_sdToken_array_i)
        // console.log("avg_sdToken_i: ", (avg_sdToken_i / 10 ** 18))
        // console.log("adjusted_avg_sdToken_i: ", (adjusted_avg_sdToken_i / 10 ** 18))
        // console.log("veSDTBalance: ", (veSDTBalance_i / 10 ** 18))
        // console.log(
        //   'Derived: ',
        //   (derived_i / 10 ** 18)
        // );
        // console.log("adjustedBalance_i: ",adjustedBalance_i/10**18)

        return [addresses[i], adjustedBalance_i / 10 ** 18];
      })
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Get votingPower : user voting power
        const votingPower = workingSupply > 0 ? (adjustedBalance[addresses[i]] * LLVotingPower) / workingSupply : 0
        return [addresses[i], votingPower];
      })
  );
}
