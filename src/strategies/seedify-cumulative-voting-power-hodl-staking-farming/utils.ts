import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const sfundStakingAbi = [
  'function userDeposits(address) external view returns (uint256, uint256, uint256, uint256, uint256, bool)'
];
export const farmingAbi = [
  'function userDeposits(address from) external view returns (uint256, uint256, uint256, uint256)'
];
export const bep20Abi = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

export const getStakingBalanceOf = (stakedBalances: any, userIndex: any) => {
  let sum: number = 0;
  let balance: any;
  for (
    let stakingContractIndex = 0;
    stakingContractIndex < stakedBalances.length;
    stakingContractIndex++
  ) {
    balance = toDecimals(stakedBalances[stakingContractIndex][userIndex]['0']);
    sum += balance;
  }
  return sum;
};

export const toDecimals = (bigNumber: any) => {
  return parseFloat(formatUnits(bigNumber.toString(), 18));
};

export const calculateBep20InLPForUser = (
  lpStaked: any,
  totalLPSupply: any,
  totalBep20InPool: any
) => {
  lpStaked = toDecimals(lpStaked['0']);

  return (lpStaked / totalLPSupply) * totalBep20InPool;
};

export const createStakingPromises: any = (stakingAddresses: any[]) => {
  const promises: any = [];
  for (let i = 0; i < stakingAddresses.length; i++) {
    promises.push(
      createPromise(sfundStakingAbi, stakingAddresses[i], 'userDeposits')
    );
  }
  return promises;
};

export const createPromise: any = (
  network: any,
  provider: any,
  abi: any,
  addresses: any,
  contractAddress: any,
  functionToCall: any,
  blockTag: any
) => {
  return multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      contractAddress,
      functionToCall,
      [address]
    ]),
    { blockTag }
  );
};
