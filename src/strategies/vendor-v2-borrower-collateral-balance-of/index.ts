import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { AbiCoder } from '@ethersproject/abi';
import { Multicaller } from '../../utils';
import { BlockTag, StaticJsonRpcProvider } from '@ethersproject/providers';

export const author = '0xdapper';
export const version = '0.1.0';

const abi = [
  'function debts(address borrower) external view returns (uint256, uint256)',
  // (poolType, owner, expiry, colToken, protocolFee, lendToken, ltv, pauseTime, lendRatio, feeRatesAndType)
  'function getPoolSettings() external view returns (uint8, address, uint48, address, uint48, address, uint48, uint48, uint256, address[], bytes32)'
];

const decodePoolSettings = (poolSettings: string) => {
  const abiCoder = new AbiCoder();
  const [
    [
      poolType,
      owner,
      expiry,
      colToken,
      protocolFee,
      lendToken,
      ltv,
      pauseTime,
      lendRatio,
      allowList,
      feeRatesAndType
    ]
  ] = abiCoder.decode(
    [
      '(uint8, address, uint48, address, uint48, address, uint48, uint48, uint256, address[], bytes32)'
    ],
    poolSettings
  );
  return {
    poolType,
    owner,
    expiry,
    colToken,
    protocolFee,
    lendToken,
    ltv,
    pauseTime,
    lendRatio,
    feeRatesAndType,
    allowList
  };
};

export async function strategy(
  space,
  network,
  provider: StaticJsonRpcProvider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag: BlockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const blockTime = (await provider.getBlock(blockTag)).timestamp;
  const poolSettings = decodePoolSettings(
    await provider.call(
      {
        to: options.address,
        data: '0xe4a0ce2f'
      },
      blockTag
    )
  );
  const hasExpired = poolSettings.expiry < blockTime;

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'debts', [address])
  );
  const result: Record<string, [BigNumberish, BigNumberish]> =
    await multi.execute();
  const multiplier = hasExpired ? 0 : options.weight || 1;

  return Object.fromEntries(
    Object.entries(result).map(([address, [, collAmount]]) => [
      address,
      parseFloat(formatUnits(collAmount, options.collateralDecimals)) *
        multiplier
    ])
  );
}
