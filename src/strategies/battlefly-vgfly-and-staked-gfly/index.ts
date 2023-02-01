import { multicall, Multicaller, subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'Archethect';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint256)',
  'function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)',
  'function totalClaimableOf(address account) external view returns (uint256 total)'
];

const calcVotingPower = (
  stakedAsString: string,
  stakedLPAsString: string,
  vestingAsString: string,
  claimableOf: BigNumberish,
  decimals: number,
  tokenWeight: number
) => {
  const staked = parseFloat(
    formatUnits(BigNumber.from(stakedAsString), decimals)
  );
  const stakedLP = parseFloat(
    formatUnits(BigNumber.from(stakedLPAsString), decimals)
  );
  const vesting = parseFloat(
    formatUnits(BigNumber.from(vestingAsString).sub(claimableOf), decimals)
  );
  return staked + vesting + stakedLP * tokenWeight;
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const DF_SUBGRAPH_URL = options.graphUrl;

  // Setup subgraph query to fetch vgFLY and staked gFLY amounts (both normal and LP) per address
  const params = {
    _meta: {
      block: {
        number: true
      }
    },
    accounts: {
      __args: {
        where: {
          id_in: addresses.map((addr: string) => addr.toLowerCase())
        },
        first: 1000
      },
      id: true,
      staked: true,
      stakedLP: true,
      vesting: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.accounts.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(DF_SUBGRAPH_URL, {
    ...params
  });

  // Take the same block number than from subgraph for consistency
  const blockTag =
    typeof snapshot === 'number' ? snapshot : result._meta.block.number;

  // fetch all token and lp contract data

  const fetchContractData = await multicall(
    network,
    provider,
    abi,
    [
      [options.lpAddress, 'token0', []],
      [options.lpAddress, 'token1', []],
      [options.lpAddress, 'getReserves', []],
      [options.lpAddress, 'totalSupply', []],
      [options.lpAddress, 'decimals', []]
    ],
    { blockTag }
  );

  // assign multicall data to variables

  const token0Address = fetchContractData[0][0];
  const token1Address = fetchContractData[1][0];
  const lpTokenReserves = fetchContractData[2];
  const lpTokenTotalSupply = fetchContractData[3][0];
  const lpTokenDecimals = fetchContractData[4][0];

  // calculate single lp token weight

  let tokenWeight;

  //For token weight we only take the gFLY part into account
  if (token0Address === options.gFLYAddress) {
    tokenWeight =
      parseFloat(formatUnits(lpTokenReserves._reserve0, options.decimals)) /
      parseFloat(formatUnits(lpTokenTotalSupply, lpTokenDecimals));
  } else if (token1Address === options.gFLYAddress) {
    tokenWeight =
      parseFloat(formatUnits(lpTokenReserves._reserve1, options.decimals)) /
      parseFloat(formatUnits(lpTokenTotalSupply, lpTokenDecimals));
  } else {
    tokenWeight = 0;
  }

  // Make sure vested vgFLY which is claimable is not counted
  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.vgFLYAddress, 'totalClaimableOf', [address])
  );
  const claimableOfResult: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    result.accounts.map((a) => [
      getAddress(a.id),
      calcVotingPower(
        a.staked,
        a.stakedLP,
        a.vesting,
        claimableOfResult[getAddress(a.id)],
        options.decimals,
        tokenWeight
      )
    ])
  );
}
