/* eslint-disable prettier/prettier */
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { formatEther } from '@ethersproject/units';

export const author = 'bonustrack';
export const version = '0.1.1'; 


const tokenAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const abiStakingPool = [
  'function getSmartPoolVotes (address account, uint256 blockNumber) public view returns (uint256 votes)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {

    const blockTag = typeof snapshot === 'number' ? snapshot : 18220909;

    const { stakingPoolMiddlewareAddress, tokenAddress } = options;

    const ethProvider = new JsonRpcProvider(
      "https://rpc.ankr.com/eth",
      'mainnet'
    ); 

    const tokenContract = new Contract(
      tokenAddress,
      tokenAbi,
      ethProvider
    );

    const stakingPoolMiddlewareContract = new Contract(
      stakingPoolMiddlewareAddress,
      abiStakingPool,
      ethProvider
    );

    const result = {};
    const tokenRequests: any = [];
    const poolRequests: any = [];

    for (let i = 0; i < addresses.length; i++) {

      const address = addresses[i];

      tokenRequests.push(
        tokenContract.balanceOf(address),
      );

      poolRequests.push(
        stakingPoolMiddlewareContract.getSmartPoolVotes(address, blockTag)
      );
    }

    const tokenBalances = await Promise.all(tokenRequests);
    const poolVotes = await Promise.all(poolRequests);

    tokenBalances.forEach((balance, index) => {

      const formattedBalance =  formatEther(balance.toString());
      const formattedVotes = formatEther(poolVotes[index].toString());

      const sum = (+formattedBalance ?? 0)+ (+formattedVotes ?? 0);

      for (let i = index; i < addresses.length; i++) {
        const address = addresses[i];
        result[address] = sum;
      }
    });

    return result;
}
