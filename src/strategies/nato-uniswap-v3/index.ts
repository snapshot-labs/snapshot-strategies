import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { multicall } from '@snapshot-labs/snapshot.js/src/utils';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

const POSITION_MANAGER_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)'
];

const POOL_ABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

function getAmount1ForLiquidity(sqrtLower: bigint, sqrtUpper: bigint, sqrtPriceCurrent: bigint, liquidity: bigint): bigint {
  if (sqrtPriceCurrent <= sqrtLower) return BigInt(0);
  if (sqrtPriceCurrent < sqrtUpper) return liquidity * (sqrtPriceCurrent - sqrtLower) / BigInt(2 ** 96);
  return liquidity * (sqrtUpper - sqrtLower) / BigInt(2 ** 96);
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const results = {};

  const poolContract = new ethers.Contract(options.pool, POOL_ABI, provider);
  const slot0 = await poolContract.slot0({ blockTag });
  const sqrtPriceX96 = BigInt(slot0[0].toString());

  for (const address of addresses) {
    const pmContract = new ethers.Contract(options.positionManager, POSITION_MANAGER_ABI, provider);
    const balance = await pmContract.balanceOf(address, { blockTag });
    let total = BigInt(0);

    for (let i = 0; i < balance; i++) {
      const tokenId = await pmContract.tokenOfOwnerByIndex(address, i, { blockTag });
      const pos = await pmContract.positions(tokenId, { blockTag });

      const token1 = pos.token1.toLowerCase();
      const fee = pos.fee;
      const liquidity = BigInt(pos.liquidity.toString());
      const tickLower = pos.tickLower;
      const tickUpper = pos.tickUpper;
      const owed1 = BigInt(pos.tokensOwed1.toString());

      if (token1 !== options.token.toLowerCase() || fee !== options.fee) continue;

      const sqrtLower = BigInt(Math.floor(Math.sqrt(1.0001 ** tickLower) * 2 ** 96));
      const sqrtUpper = BigInt(Math.floor(Math.sqrt(1.0001 ** tickUpper) * 2 ** 96));

      const amount1 = getAmount1ForLiquidity(sqrtLower, sqrtUpper, sqrtPriceX96, liquidity);
      const votingPower = amount1 + owed1;
      total += votingPower;
    }

    results[getAddress(address)] = parseFloat(formatUnits(total.toString(), 18));
  }

  return results;
}
