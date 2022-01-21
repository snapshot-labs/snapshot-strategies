import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'onigiri-x';
export const version = '0.1.0';

const abi = [
  'function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const pairAddresses = [
    '0x7ecb3be21714114d912469810aedd34e6fc27736',
    '0x3203bf44d434452b4605c7657c51bfeaf2a0847c'
  ];
  const priceResponse = await multicall(
    network,
    provider,
    abi,
    pairAddresses.map((address: any) => [address, 'getReserves', []]),
    { blockTag }
  );

  const priceDecoToEth =
    parseFloat(priceResponse[0]._reserve1) /
    parseFloat(priceResponse[0]._reserve0);
  const priceEthToMona =
    parseFloat(priceResponse[1]._reserve0) /
    parseFloat(priceResponse[1]._reserve1);

  const erc20Balances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      erc20Balances[address] * priceDecoToEth * priceEthToMona
    ])
  );
}
