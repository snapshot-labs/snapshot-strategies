import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'planet-finance';
export const version = '0.0.1';

const planetFinanceFarmAbi = [
  'function poolInfo(uint256) returns (address want,uint256 allocPoint,uint256 lastRewardBlock,uint256 accAQUAPerShare,address strat)',
  'function stakedWantTokens(uint256 _pid, address _user) returns (uint256)'
];

const bep20Abi: any = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

const aquaInfinityAbi = [
  'function getUserGtokenBal(address) view returns (uint256)'
]

const aquaLendingAbi = [
  'function getAccountSnapshot(address) view returns (uint256,uint256,uint256,uint256)'
];

const planetFinanceFarmContractAddress =
  '0x0ac58Fd25f334975b1B61732CF79564b6200A933';

const gammaFarmAddress = '0xB87F7016585510505478D1d160BDf76c1f41b53d';

const aquaAddress = '0x72B7D61E8fC8cF971960DD9cfA59B8C829D91991';

const aquaBnbLpTokenAddress = '0x03028D2F8B275695A1c6AFB69A4765e3666e36d9';

const aquaGammaLpTokenAddress = '0xcCaF3fcE9f2D7A7031e049EcC65c0C0Cc331EE0D';

const aquaLendingAddress = '0xb7eD4A5AF620B52022fb26035C565277035d4FD7';

const aquaInfinityAddress = '0x220940EA8eE1de82083c0329795D2f47C92879dF';

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

  // returns user's aqua balance in aqua only vault
  let usersAquaVaultBalances: any = multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['1', address]
    ]),
    { blockTag }
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

  // returns user's aqua balance in aqua-bnb vault
  let usersAquaGammaVaultBalances: any = multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      gammaFarmAddress,
      'stakedWantTokens',
      ['0', address]
    ]),
    { blockTag }
  );

  // returns user's aqua balance in aqua-bnb vault
  let usersNewAquaBnbVaultBalances: any = multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      gammaFarmAddress,
      'stakedWantTokens',
      ['1', address]
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
    usersAquaVaultBalances,
    usergAquaBalInAquaInfinityVault,
    usersAquaGammaVaultBalances,
    usersNewAquaBnbVaultBalances,
    usersAquaInLending
  ]);

  score = result[0];
  usersAquaVaultBalances = result[1];
  usergAquaBalInAquaInfinityVault = result[2];
  usersAquaGammaVaultBalances = result[3];
  usersNewAquaBnbVaultBalances = result[4];
  usersAquaInLending = result[5];

  //AQUA-BNB
  erc20Multi.call('aquaBnbTotalSupply', aquaBnbLpTokenAddress, 'totalSupply');

  erc20Multi.call('aquaBnbAquaBal', aquaAddress, 'balanceOf', [
    aquaBnbLpTokenAddress
  ]);

  //AQUA-GAMMA
  erc20Multi.call(
    'aquaGammaTotalSupply',
    aquaGammaLpTokenAddress,
    'totalSupply'
  );

  erc20Multi.call('aquaGammaAquaBal', aquaAddress, 'balanceOf', [
    aquaGammaLpTokenAddress
  ]);

  const erc20Result = await erc20Multi.execute();

  const totalSupply = erc20Result.aquaBnbTotalSupply.toString();

  const contractAquaBalance = erc20Result.aquaBnbAquaBal.toString();

  const totalSupplyAquaGamma = erc20Result.aquaGammaTotalSupply.toString();

  const aquaGammaContractAquaBalance = erc20Result.aquaGammaAquaBal.toString();

  const res = Object.fromEntries(
    Object.entries(score).map((address: any, index) => [
      
      address[0],

      address[1] +

        parseFloat(formatUnits(usersAquaVaultBalances[index].toString(), 18)) +
        
        (parseFloat(formatUnits(usersNewAquaBnbVaultBalances[index].toString(), 18)) / parseFloat(formatUnits(totalSupply, 18))) 
        * parseFloat(formatUnits(contractAquaBalance, 18)) 
          
        +

        (parseFloat(formatUnits(usersAquaGammaVaultBalances[index].toString(), 18)) / parseFloat(formatUnits(totalSupplyAquaGamma, 18))) 
        * parseFloat(formatUnits(aquaGammaContractAquaBalance, 18)) 
        
        +
        
        parseFloat(formatUnits(usergAquaBalInAquaInfinityVault[index].toString(),18)) *
        parseFloat(formatUnits(usersAquaInLending[index]['3'], 18)) *
        increase_in_voting
        
        +
        
        parseFloat(formatUnits(usersAquaInLending[index]['1'], 18)) *
        parseFloat(formatUnits(usersAquaInLending[index]['3'], 18))
    ])
  );

  return res
}
