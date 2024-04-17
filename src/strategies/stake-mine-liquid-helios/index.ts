import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { BigNumberish } from '@ethersproject/bignumber';

export const author = 'asim07';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function getUserCurrentActiveShares(address) external view returns (uint256)',
  'function getUserMints(address) external view returns ((uint256,uint256,uint256,(uint256,uint16,uint256,uint48,uint48,uint256,uint256,uint256,uint256,uint256,uint256,uint256))[])'
];

enum MintStatus {
  ACTIVE,
  CLAIMED,
  BURNED
}

interface UserMintInfo {
  mintPower: BigNumberish;
  numOfDays: number;
  mintableHlx: BigNumberish;
  mintStartTs: number;
  maturityTs: number;
  mintPowerBonus: BigNumberish;
  EAABonus: BigNumberish;
  mintedHlx: BigNumberish;
  mintCost: BigNumberish;
  penalty: BigNumberish;
  titanBurned: BigNumberish;
  status: MintStatus;
}

interface UserMint {
  mId: BigNumberish;
  hRank: BigNumberish;
  gMintPower: BigNumberish;
  mintInfo: UserMintInfo;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const {
    address: tokenAddress,
    sharesWeight,
    tokenWeight,
    mintableWeight,
    decimals
  } = options;

  const tokenResponse: BigNumber[] = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => {
      return [tokenAddress, 'balanceOf', [address.toLowerCase()]];
    }),
    { blockTag }
  );

  const userMintsResponses: UserMint[][][] = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => {
      return [tokenAddress, 'getUserMints', [address.toLowerCase()]];
    }),
    { blockTag }
  );
  // Calculate and sum mintableHlx for each user
  const mintableHlxSums = userMintsResponses.map(
    (userMints) =>
      userMints.reduce(
        (userSum, mints) =>
          userSum +
          mints.reduce((sum, mint) => {
            // Extract mintableHlx, ensure mint[3] is defined and mint[3][2] is not undefined
            const mintableHlx =
              mint[3] && mint[3][2] !== undefined && parseInt(mint[3][11]) === 0
                ? parseFloat(formatUnits(mint[3][2], decimals))
                : 0;
            return sum + mintableHlx; // Sum mintableHlx for this mint to the total for the current user's mints
          }, 0),
        0
      ) // Start with 0 sum for each user
  );

  const tokenBalances = Object.fromEntries(
    Object.entries(tokenResponse).map(([address, balance]) => [
      address,
      formatUnits(balance.toString(), decimals)
    ])
  );

  const shares = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => {
      return [
        tokenAddress,
        'getUserCurrentActiveShares',
        [address.toLowerCase()]
      ];
    }),
    { blockTag }
  );

  return Object.fromEntries(
    shares.map((value, index) => {
      const formattedShares = +(
        parseFloat(formatUnits(value.toString(), decimals)) * sharesWeight ?? 0
      );
      const formattedBalance = +(
        parseFloat(tokenBalances[index].toString()) * tokenWeight ?? 0
      );
      const formattedMintable = +(
        parseFloat(mintableHlxSums[index].toString()) * mintableWeight ?? 0
      );
      const sum = formattedBalance + formattedShares + formattedMintable;

      return [addresses[index], sum];
    })
  );
}
