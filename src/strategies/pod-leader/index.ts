import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'ursamaritimus';
export const version = '0.3.0';

/*
 * PodLeader pool balance. Accepted options:
 * - chefAddress: Masterchef contract address
 * - pid: Mastechef pool id (starting with zero)
 *
 * - uniPairAddress: Address of a uniswap pair (or a sushi pair or any other with the same interface)
 *    - If the uniPairAddress option is provided, converts staked LP token balance to base token balance
 *      (based on the pair total supply and base token reserve)
 *    - If uniPairAddress is null or undefined, returns staked token balance of the pool
 *
 * - tokenAddress: Address of a token for single token Pools.
 *    - if the uniPairAddress is provided the tokenAddress is ignored.
 *
 * - weight: Integer multiplier of the result (for combining strategies with different weights, totally optional)
 * - weightDecimals: Integer value of number of decimal places to apply to the final result
 *
 * - token0.address: Address of the uniPair token 0. If defined, the strategy will return the result for the token0.
 *                   
 * - token0.weight: Integer multiplier of the result for token0
 * - token0.weightDecimals: Integer value of number of decimal places to apply to the result of token0
 *
 * - token1.address: Address of the uniPair token 1. If defined, the strategy will return the result for the token1.
 *                   
 * - token1,weight: Integer multiplier of the result for token1
 * - token1.weightDecimal: Integer value of number of decimal places to apply to the result of token1
 *
 *
 * - log: Boolean flag to enable or disable logging to the console (used for debugging purposes during development)
 *

 *
 * Check the examples.json file for how to use the options.
 */

const abi = [
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardTokenDebt)',
  'function totalSupply() view returns (uint256)',
  'function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function decimals() view returns (uint8)'
];

let log: string[] = [];
let _options;

const getUserInfoCalls = (addresses: any[]) => {
  const result: any[] = [];

  for (const address of addresses) {
    result.push([_options.chefAddress, 'userInfo', [_options.pid, address]]);
  }

  return result;
};

const getTokenCalls = () => {
  const result: any[] = [];

  if (_options.uniPairAddress != null) {
    result.push([_options.uniPairAddress, 'totalSupply', []]);
    result.push([_options.uniPairAddress, 'getReserves', []]);
    result.push([_options.uniPairAddress, 'token0', []]);
    result.push([_options.uniPairAddress, 'token1', []]);
    result.push([_options.uniPairAddress, 'decimals', []]);

    if (_options.token0?.address != null) {
      result.push([_options.token0.address, 'decimals', []]);
    }

    if (_options.token1?.address != null) {
      result.push([_options.token1.address, 'decimals', []]);
    }
  } else if (_options.tokenAddress != null) {
    result.push([_options.tokenAddress, 'decimals', []]);
  }

  return result;
};

function arrayChunk<T>(arr: T[], chunkSize: number): T[][] {
  const result: T[][] = [];

  for (let i = 0, j = arr.length; i < j; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
}

async function processValues(
  values: any[],
  tokenValues: any[],
  network: any,
  provider: any,
  blockTag: string | number
) {
  log.push(`values = ${JSON.stringify(values, undefined, 2)}`);
  log.push(`tokenValues = ${JSON.stringify(tokenValues, undefined, 2)}`);
  printLog();

  const poolStaked = values[0][0] as BigNumber;
  const weight = BigNumber.from(_options.weight || 1);
  const weightDecimals = BigNumber.from(10).pow(
    BigNumber.from(_options.weightDecimals || 0)
  );

  let result = 0;

  if (_options.uniPairAddress == null) {
    log.push(`poolStaked = ${poolStaked}`);

    if (_options.tokenAddress != null) {
      const tokenDecimals = BigNumber.from(10).pow(
        BigNumber.from(tokenValues[0][0])
      );

      log.push(`tokenDecimals = ${tokenDecimals}`);
      log.push(`decimals = ${_options.decimals}`);
      printLog();

      result = toFloat(poolStaked.div(tokenDecimals), _options.decimals);
    } else {
      printLog();
      result = toFloat(poolStaked, _options.decimals);
    }
  } else {
    const uniTotalSupply = tokenValues[0][0];
    const uniReserve0 = tokenValues[1][0];
    const uniReserve1 = tokenValues[1][1];
    const uniPairDecimalsIndex: any =
      _options.uniPairAddress != null ? 4 : null;
    const uniPairDecimalsCount = tokenValues[uniPairDecimalsIndex][0];
    const uniPairDecimals =
      uniPairDecimalsIndex != null
        ? BigNumber.from(10).pow(BigNumber.from(uniPairDecimalsCount || 0))
        : BigNumber.from(1);

    const token0Address = tokenValues[2][0];
    const useToken0 =
      _options.token0?.address != null &&
      _options.token0.address.toString().toLowerCase() ==
        token0Address?.toString().toLowerCase();

    log.push(`useToken0 = ${useToken0}`);

    if (useToken0) {
      const token0DecimalsIndex = 5;

      log.push(`token0DecimalsIndex = ${token0DecimalsIndex}`);
      log.push(`tokenValues = ${JSON.stringify(tokenValues, undefined, 2)}`);
      printLog();

      result += await GetTokenValue(
        network,
        provider,
        blockTag,
        uniTotalSupply,
        uniReserve0,
        uniPairDecimals,
        poolStaked,
        tokenValues,
        token0Address,
        token0DecimalsIndex,
        _options.token0?.weight,
        _options.token0?.weightDecimals
      );
    }

    const token1Address = tokenValues[3][0];
    const useToken1 =
      _options.token1?.address != null &&
      _options.token1.address.toString().toLowerCase() ==
        token1Address?.toString().toLowerCase();

    log.push(`useToken1 = ${useToken1}`);

    if (useToken1) {
      const token1DecimalsIndex = _options.token0?.address != null ? 6 : 5;

      log.push(`token1DecimalsIndex = ${token1DecimalsIndex}`);
      log.push(`tokenValues = ${JSON.stringify(tokenValues, undefined, 2)}`);
      printLog();

      result += await GetTokenValue(
        network,
        provider,
        blockTag,
        uniTotalSupply,
        uniReserve1,
        uniPairDecimals,
        poolStaked,
        tokenValues,
        token1Address,
        token1DecimalsIndex,
        _options.token1?.weight,
        _options.token1?.WeightDecimals
      );
    }

    if (!useToken0 && !useToken1) {
      log.push(`poolStaked = ${poolStaked}`);
      log.push(`uniPairDecimals = ${uniPairDecimals}`);
      printLog();

      const tokenCount = poolStaked.toNumber() / 10 ** uniPairDecimalsCount;

      log.push(`tokenCount = ${tokenCount}`);

      result = tokenCount / 10 ** (_options.decimals || 0);
    }
  }

  log.push(`result = ${result}`);
  printLog();

  result *= weight.toNumber() / weightDecimals.toNumber();

  log.push(`weight = ${weight}`);
  log.push(`weightDecimals = ${weightDecimals}`);
  log.push(`result = ${result}`);
  printLog();

  return result;
}

function toFloat(value: BigNumber, decimals: any): number {
  const decimalsResult = decimals === 0 ? 0 : decimals || 18;

  log.push(`toFloat value = ${value}`);
  log.push(`toFloat decimals = ${decimals}`);
  log.push(`toFloat decimalsResult = ${decimalsResult}`);
  printLog();

  return parseFloat(formatUnits(value.toString(), decimalsResult));
}

async function GetTokenValue(
  network: any,
  provider: any,
  blockTag: string | number,
  uniTotalSupply: any,
  uniReserve: any,
  uniPairDecimals: BigNumber,
  poolStaked: BigNumber,
  tokenValues: any[],
  tokenAddress: any,
  tokenDecimalsIndex: any,
  tokenWeight: any,
  tokenWeightDecimals: any
) {
  const weightDecimals = BigNumber.from(10).pow(
    BigNumber.from(tokenWeightDecimals || 0)
  );
  const weight = BigNumber.from(tokenWeight || 1);
  const tokensPerLp = uniReserve.mul(uniPairDecimals).div(uniTotalSupply);

  const tokenDecimals =
    tokenDecimalsIndex != null
      ? BigNumber.from(10).pow(
          BigNumber.from(tokenValues[tokenDecimalsIndex][0] || 0)
        )
      : BigNumber.from(1);
  log.push(`tokenAddress = ${tokenAddress}`);
  log.push(`tokenDecimals = ${tokenDecimals}`);
  log.push(`poolStaked = ${poolStaked}`);
  log.push(`uniReserve = ${uniReserve}`);
  log.push(`uniPairDecimals = ${uniPairDecimals}`);
  log.push(`uniTotalSupply = ${uniTotalSupply}`);
  log.push(`tokensPerLp = ${tokensPerLp}`);
  log.push(`tokenWeight = ${weight}`);
  log.push(`tokenWeightDecimals = ${weightDecimals}`);

  printLog();

  const tokenCount = poolStaked
    .mul(tokensPerLp)
    .div(tokenDecimals)
    .mul(weight)
    .div(weightDecimals);

  log.push(`tokenCount = ${tokenCount}`);

  return toFloat(tokenCount, _options.decimals);
}

function printLog() {
  if (_options.log || false) {
    console.debug(log);
    log = [];
  }
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  _options = options;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const userInfoCalls = getUserInfoCalls(addresses);
  const tokenCalls = getTokenCalls();
  const entries = new Map<PropertyKey, any>();

  const userInfoResponse = await multicall(
    network,
    provider,
    abi,
    userInfoCalls,
    { blockTag }
  );

  const userInfoChunks = arrayChunk(userInfoResponse, 1);

  const tokenResponse = await multicall(network, provider, abi, tokenCalls, {
    blockTag
  });

  for (let i = 0; i < userInfoChunks.length; i++) {
    const value = userInfoChunks[i];
    const score = await processValues(
      value,
      tokenResponse,
      network,
      provider,
      blockTag
    );

    entries.set(addresses[i], score);
  }

  return Object.fromEntries(entries);
}
