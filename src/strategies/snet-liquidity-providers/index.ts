import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = 'Vivek205';
export const version = '0.1.0';

type FinalResult = [
  Record<string, BigNumberish>,
  Record<string, BigNumberish>,
  BigNumberish
];

const erc20Abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint)'
];

const parseNumber = (value: BigNumberish): BigNumber => BigNumber.from(value);

const computeTokenContribution = (
  lpBalance: BigNumber,
  lpTotalSupply: BigNumber,
  contractTokenBalance: BigNumber
) => {
  lpTotalSupply = lpTotalSupply.isZero() ? BigNumber.from(1) : lpTotalSupply;
  const tokenContribution = lpBalance
    .mul(contractTokenBalance)
    .div(lpTotalSupply);
  return tokenContribution;
};

const multiCallerFactory = (network, provider, blockTag) => (abi) =>
  new Multicaller(network, provider, abi, { blockTag });

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const { address: tokenAddress, lpAddress } = options;

  const initMultiCaller = multiCallerFactory(network, provider, blockTag);

  const lpBalanceCaller = initMultiCaller(erc20Abi);
  const lpTotalSupplyCaller = initMultiCaller(erc20Abi);

  addresses.forEach((address) => {
    lpBalanceCaller.call(address, lpAddress, 'balanceOf', [address]);
    lpTotalSupplyCaller.call(address, lpAddress, 'totalSupply', []);
  });

  const contractBalanceCall = () =>
    call(provider, erc20Abi, [tokenAddress, 'balanceOf', [lpAddress]]);

  const [
    lpBalanceResult,
    lpTotalSupplyResult,
    contractBalanceResult
  ]: FinalResult = await Promise.all([
    lpBalanceCaller.execute(),
    lpTotalSupplyCaller.execute(),
    contractBalanceCall()
  ]);

  const contractTokenBalance = parseNumber(contractBalanceResult);

  return Object.fromEntries(
    addresses.map((address) => {
      const lpBalance = parseNumber(lpBalanceResult[address]);
      const lpTotalSupply = parseNumber(lpTotalSupplyResult[address]);
      const senderTokenShare = computeTokenContribution(
        lpBalance,
        lpTotalSupply,
        contractTokenBalance
      );

      return [
        address,
        parseFloat(formatUnits(senderTokenShare, options.lpDecimals))
      ];
    })
  );
}
