import { formatUnits } from '@ethersproject/units';

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

export const getStakingBalanceOf = (
  stakedBalances: any,
  userIndex: any,
  stakingAddrAmount: any,
  userAmount: any
) => {
  let sum = 0;
  let balance: any, userPosition: any;
  for (
    let stakingContractIndex = 0;
    stakingContractIndex < stakingAddrAmount;
    stakingContractIndex++
  ) {
    userPosition = userAmount * stakingContractIndex;
    balance = toDecimals(stakedBalances[userPosition + userIndex]['0']);
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

export const createCallsToReadUsersData: any = (
  addresses: any[],
  stakingAddresses: any[],
  functionToCall: string
) => {
  const promises: any = [];
  for (let i = 0; i < stakingAddresses.length; i++) {
    promises.push(
      ...createCallToReadUsersData(
        addresses,
        stakingAddresses[i],
        functionToCall
      )
    );
  }
  return promises;
};

export const createCallToReadUsersData: any = (
  addresses: any,
  contractAddress: any,
  functionToCall: any
) => {
  return addresses.map((address: any) => [
    contractAddress,
    functionToCall,
    [address]
  ]);
};
