import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { getProvider, Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'andytcf';
export const version = '1.0.0';

const SDSABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

const DebtCacheABI = [
  'function currentDebt() view returns (uint256 debt, bool anyRateIsInvalid)'
];

const calculateSDSValue = async (
  provider: Provider,
  blockTag: number | string,
  debtCacheAddress: string,
  sdsAddress: string
) => {
  const DebtCacheContract = new Contract(
    debtCacheAddress,
    DebtCacheABI,
    provider
  );

  const currentDebt = await DebtCacheContract.currentDebt({
    blockTag
  });

  const SDSContract = new Contract(sdsAddress, SDSABI, provider);

  const totalSupply = await SDSContract.totalSupply({
    blockTag
  });

  const value = Number(currentDebt.debt / totalSupply);

  return value;
};

export async function strategy(
  _space,
  _network,
  _provider,
  _addresses,
  _options,
  _snapshot
) {
  const score: Record<string, number> = {};

  const blockTag = typeof _snapshot === 'number' ? _snapshot : 'latest';
  const L2BlockTag =
    typeof _options.L2BlockNumber === 'number'
      ? _options.L2BlockNumber
      : 'latest';

  const optimismProvider = getProvider('10');

  const L1SDSValue = await calculateSDSValue(
    _provider,
    _snapshot,
    _options.L1DebtCache,
    _options.L1SDS
  );

  const L2SDSValue = await calculateSDSValue(
    optimismProvider,
    L2BlockTag,
    _options.L2DebtCache,
    _options.L2SDS
  );

  const callL1SDSBalance = new Multicaller(_network, _provider, SDSABI, {
    blockTag
  });
  for (const walletAddress of _addresses) {
    callL1SDSBalance.call(walletAddress, _options.L1SDS, 'balanceOf', [
      walletAddress
    ]);
  }

  const L1SDSBalances: Record<string, BigNumber> =
    await callL1SDSBalance.execute();

  Object.entries(L1SDSBalances).forEach(([address, balance]) => {
    score[getAddress(address)] = Number(formatEther(balance)) * L1SDSValue;
  });

  const callL2SDSBalance = new Multicaller('10', optimismProvider, SDSABI, {
    blockTag: L2BlockTag
  });

  for (const walletAddress of _addresses) {
    callL2SDSBalance.call(walletAddress, _options.L2SDS, 'balanceOf', [
      walletAddress
    ]);
  }

  const L2SDSBalances: Record<string, BigNumber> =
    await callL2SDSBalance.execute();

  Object.entries(L2SDSBalances).forEach(([address, balance]) => {
    score[getAddress(address)] += Number(formatEther(balance)) * L2SDSValue;
  });

  /** Quadratic Weighting */
  if (_options.quadratic) {
    return Object.fromEntries(
      Object.entries(score).map(([address, balance]) => [
        address,
        Math.sqrt(balance)
      ])
    );
  } else {
    return score;
  }
}
