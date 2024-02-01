import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'defininja';
export const version = '0.0.2';

//abi
//v3 aqua-btcb strategy abi
const aquaBtcbstratAbi = [
  'function getEarningShares(address) view returns (uint256)'
];
// v3 farm abi for user-info
const planetFinanceV3FarmAbi = [
  'function userInfo(uint256, address) view returns (uint256, uint256,  uint256,  uint256)'
];

// v2 farm abi for user-info
const planetFinanceFarmAbi = [
  'function userInfo(uint256, address) view returns (uint256, uint256,  uint256,  uint256,  uint256,  uint256,  uint256, uint256)'
];

// erc20 abi for total supply and balance of
const bep20Abi: any = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

//v2 aqua infinity pool abi
const aquaInfinityAbi = [
  'function getUserGtokenBal(address) view returns (uint256)'
];

// abi for aqua lending
const aquaLendingAbi = [
  'function getAccountSnapshot(address) view returns (uint256,uint256,uint256,uint256)'
];

//addresses
const gammaFarmAddress = '0x9EBce8B8d535247b2a0dfC0494Bc8aeEd7640cF9'; //v2 farm address
const aquaAddress = '0x72B7D61E8fC8cF971960DD9cfA59B8C829D91991'; //aqua token address
const aquaBnbLpTokenAddress = '0x03028D2F8B275695A1c6AFB69A4765e3666e36d9'; //v2 aqua-bnb lp token address
const aquaLendingAddress = '0x2f5d7A9D8D32c16e41aF811744DB9f15d853E0A5'; //aqua lending address
const aquaInfinityAddress = '0xddd0626BB795BdF9CfA925da5102eFA5E7008114'; //v2 aqua infinity pool address
const v3FarmAddress = '0x405960AEAad7Ec8B419DEdb511dfe9D112dFc22d'; //v3 farm address
const aquaBtcbLpTokenAddress = '0x70B606c23D6E786BE7accAf31C8fEcEaf846AdF3'; // v3 aqua-btcb lp token address
const aquaBtcbstrat = '0x2C7EA70259DD5153b7f8bAB177126fce850bFB1d'; //v3 aqua-btcb strategy address

const increase_in_voting = 5; //increase weight 5 times while voting

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const erc20Multi = new Multicaller(network, provider, bep20Abi, {
    blockTag
  });

  // returns user's aqua balance for their wallet address
  let score: any = erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  //returns user's shares  in aqua auto comp vault
  let usergAquaBalInAquaInfinityVault: any = multicall(
    network,
    provider,
    aquaInfinityAbi,
    addresses.map((address: any) => [
      aquaInfinityAddress,
      'getUserGtokenBal',
      [address]
    ]),
    { blockTag }
  );

  // returns user's shares in v2 aqua-bnb pool
  let usersNewAquaBnbVaultBalances: any = multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      gammaFarmAddress,
      'userInfo',
      ['2', address]
    ]),
    { blockTag }
  );

  // returns user's shares in v3 aqua-btcb pool
  let usersNewAquaBtcbVaultBalances: any = multicall(
    network,
    provider,
    planetFinanceV3FarmAbi,
    addresses.map((address: any) => [
      v3FarmAddress,
      'userInfo',
      ['1', address]
    ]),
    { blockTag }
  );

  // returns user's aqua balance in aqua pool
  let usersNewAquaPoolBalances: any = multicall(
    network,
    provider,
    planetFinanceV3FarmAbi,
    addresses.map((address: any) => [
      v3FarmAddress,
      'userInfo',
      ['2', address]
    ]),
    { blockTag }
  );

  // user earning shares in aqua-btcb pool
  let usersEarningSharesInAquaBtcbPool: any = multicall(
    network,
    provider,
    aquaBtcbstratAbi,
    addresses.map((address: any) => [
      aquaBtcbstrat,
      'getEarningShares',
      [address]
    ]),
    { blockTag }
  );

  //users aqua balance in aqua lending
  let usersAquaInLending: any = multicall(
    network,
    provider,
    aquaLendingAbi,
    addresses.map((address: any) => [
      aquaLendingAddress,
      'getAccountSnapshot',
      [address]
    ]),
    { blockTag }
  );

  // get all results
  const result = await Promise.all([
    score,
    usergAquaBalInAquaInfinityVault,
    usersNewAquaBnbVaultBalances,
    usersAquaInLending,
    usersNewAquaBtcbVaultBalances,
    usersNewAquaPoolBalances,
    usersEarningSharesInAquaBtcbPool
  ]);

  score = result[0]; //aqua balance of user's wallet address
  usergAquaBalInAquaInfinityVault = result[1]; //aqua balance of infinitiy vault
  usersNewAquaBnbVaultBalances = result[2]; //shares in v2 aqua-bnb pool
  usersAquaInLending = result[3]; // aqua balance in aqua lending
  usersNewAquaBtcbVaultBalances = result[4]; //shares in v3 aqua-btcb pool
  usersNewAquaPoolBalances = result[5]; // shares in v3 aqua pool
  usersEarningSharesInAquaBtcbPool = result[6]; //earning shares in v3 aqua-btcb pool

  //AQUA-BNB
  // total supply of v2 aqua bnb lp token
  erc20Multi.call('aquaBnbTotalSupply', aquaBnbLpTokenAddress, 'totalSupply');

  // aqua balance of v2 aqua bnb lp
  erc20Multi.call('aquaBnbAquaBal', aquaAddress, 'balanceOf', [
    aquaBnbLpTokenAddress
  ]);

  //AQUA-BTCB
  // total supply of v3 aqua btcb lp token
  erc20Multi.call('aquaBtcbTotalSupply', aquaBtcbLpTokenAddress, 'totalSupply');

  // aqua balance of v3 aqua btcb lp
  erc20Multi.call('aquaBtcbAquaBal', aquaAddress, 'balanceOf', [
    aquaBtcbLpTokenAddress
  ]);

  // execute multi calls
  const erc20Result = await erc20Multi.execute();
  // total supply of v2 qua bnb lp token
  const totalSupply = erc20Result.aquaBnbTotalSupply.toString();
  // aqua balance of v2 aqua bnb lp
  const contractAquaBalance = erc20Result.aquaBnbAquaBal.toString();
  // total supply of v3 aqua btcb lp token
  const totalSupplyAquabtcb = erc20Result.aquaBtcbTotalSupply.toString();
  // aqua balance of v3 aqua btcb lp
  const contractAquaBtcbBalance = erc20Result.aquaBtcbAquaBal.toString();

  const res = Object.fromEntries(
    Object.entries(score).map((address: any, index) => {
      /*
      user's voting score  = user's wallet aqua balance + aqua balance in v2 aqua-bnb pool + 5 times the aqua balance in v2 infinity vault  +
      aqua balance in lending + 5 times the aqua balance in v3 aqua pool + aqua balance in v3 aqua-btcb pool
      */
      return [
        address[0],

        address[1] +
          (parseFloat(
            formatUnits(usersNewAquaBnbVaultBalances[index]['0'].toString(), 18)
          ) /
            parseFloat(formatUnits(totalSupply, 18))) *
            parseFloat(formatUnits(contractAquaBalance, 18)) +
          parseFloat(
            formatUnits(usergAquaBalInAquaInfinityVault[index].toString(), 18)
          ) *
            parseFloat(formatUnits(usersAquaInLending[index]['3'], 18)) *
            increase_in_voting +
          parseFloat(formatUnits(usersAquaInLending[index]['1'], 18)) *
            parseFloat(formatUnits(usersAquaInLending[index]['3'], 18)) +
          increase_in_voting *
            parseFloat(
              formatUnits(usersNewAquaPoolBalances[index]['2'].toString(), 18)
            ) +
          (parseFloat(
            formatUnits(
              usersNewAquaBtcbVaultBalances[index]['2'].toString(),
              18
            )
          ) == 0
            ? 0
            : (parseFloat(
                formatUnits(
                  usersNewAquaBtcbVaultBalances[index]['2'].toString(),
                  18
                )
              ) /
                parseFloat(formatUnits(totalSupplyAquabtcb, 18))) *
              parseFloat(formatUnits(contractAquaBtcbBalance, 18)) *
              (parseFloat(
                formatUnits(
                  usersEarningSharesInAquaBtcbPool[index].toString(),
                  18
                )
              ) /
                parseFloat(
                  formatUnits(
                    usersNewAquaBtcbVaultBalances[index]['2'].toString(),
                    18
                  )
                )))
      ];
    })
  );
  return res;
}
