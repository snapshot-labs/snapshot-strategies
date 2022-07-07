import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = 'crypto-dump';
export const version = '0.1.0';

const nftContractAbi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

const tokenContractAbi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint256)'
];

interface StrategyOptions {
  decimals: number;
  tokenAddress: string;
  nftAddress: string;
  nftMultiplier: number;
}

type MultiCallResult = Record<string, BigNumberish>;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: StrategyOptions,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const callTokenDecimal = () => {
    return call(provider, tokenContractAbi, [
      options.tokenAddress,
      'decimals',
      []
    ]);
  };

  const makeMulticaller = (abi, contractAddress) => {
    const multiCaller = new Multicaller(network, provider, abi, {
      blockTag
    });
    addresses.forEach((address) =>
      multiCaller.call(address, contractAddress, 'balanceOf', [address])
    );
    return multiCaller;
  };

  const erc20Multi = makeMulticaller(tokenContractAbi, options.tokenAddress);
  const erc721Multi = makeMulticaller(nftContractAbi, options.nftAddress);

  const [tokenDecimal, tokenResults, nftResults]: [
    BigNumber,
    MultiCallResult,
    MultiCallResult
  ] = await Promise.all([
    callTokenDecimal(),
    erc20Multi.execute(),
    erc721Multi.execute()
  ]);

  const scores: Record<string, BigNumber> = {};

  for (const address of addresses) {
    const tokenScore = BigNumber.from(tokenResults[address] || 0);

    const nftScore = BigNumber.from(nftResults[address] || 0)
      .mul(options.nftMultiplier)
      .mul(BigNumber.from(10).pow(tokenDecimal));
    scores[address] = tokenScore.add(nftScore);
  }

  return Object.fromEntries(
    Object.entries(scores).map(([address, score]) => [
      address,
      parseFloat(formatUnits(score, options.decimals))
    ])
  );
}
