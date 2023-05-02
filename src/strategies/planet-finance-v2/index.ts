import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'defininja';
export const version = '0.0.2';

const planetFinanceFarmAbi = [
  'function userInfo(uint256, address) view returns (uint256, uint256,  uint256,  uint256,  uint256,  uint256,  uint256, uint256)'
];

const bep20Abi: any = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

const aquaInfinityAbi = [
  'function getUserGtokenBal(address) view returns (uint256)'
];

const aquaLendingAbi = [
  'function getAccountSnapshot(address) view returns (uint256,uint256,uint256,uint256)'
];

const gammaFarmAddress = '0x9EBce8B8d535247b2a0dfC0494Bc8aeEd7640cF9';

const aquaAddress = '0x72B7D61E8fC8cF971960DD9cfA59B8C829D91991';

const aquaBnbLpTokenAddress = '0x03028D2F8B275695A1c6AFB69A4765e3666e36d9';

const aquaLendingAddress = '0x2f5d7A9D8D32c16e41aF811744DB9f15d853E0A5';

const aquaInfinityAddress = '0xddd0626BB795BdF9CfA925da5102eFA5E7008114';

const increase_in_voting = 5; //increase 5 times

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

  // returns user's aqua balance ofr their address
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

  // returns user's aqua balance in aqua-bnb pool
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

  //AQUA LENDING
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

  const result = await Promise.all([
    score,
    usergAquaBalInAquaInfinityVault,
    usersNewAquaBnbVaultBalances,
    usersAquaInLending
  ]);

  score = result[0];
  usergAquaBalInAquaInfinityVault = result[1];
  usersNewAquaBnbVaultBalances = result[2];
  usersAquaInLending = result[3];

  //AQUA-BNB
  // total supply of aqua bnb lp token
  erc20Multi.call('aquaBnbTotalSupply', aquaBnbLpTokenAddress, 'totalSupply');

  // aqua balance of aqua bnb lp
  erc20Multi.call('aquaBnbAquaBal', aquaAddress, 'balanceOf', [
    aquaBnbLpTokenAddress
  ]);

  const erc20Result = await erc20Multi.execute();

  const totalSupply = erc20Result.aquaBnbTotalSupply.toString();

  const contractAquaBalance = erc20Result.aquaBnbAquaBal.toString();

  const res = Object.fromEntries(
    Object.entries(score).map((address: any, index) => {
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
            parseFloat(formatUnits(usersAquaInLending[index]['3'], 18))
      ];
    })
  );
  return res;
}
