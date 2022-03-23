import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'pancake-swap';
export const version = '0.0.1';

const CAKE_ADDRESS = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';

const onChainVPBlockNumber = 16300686;
const onChainVPAddress = '0xc0FeBE244cE1ea66d27D23012B3D616432433F42';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_user',
        type: 'address'
      }
    ],
    name: 'getVotingPowerWithoutPool',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  if (
    blockTag === 'latest' ||
    (typeof blockTag === 'number' && blockTag >= onChainVPBlockNumber)
  ) {
    const response = await multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [
        onChainVPAddress,
        'getVotingPowerWithoutPool',
        [address.toLowerCase()]
      ]),
      { blockTag }
    );
    return Object.fromEntries(
      response.map((value, i) => [
        addresses[i],
        parseFloat(formatUnits(value.toString(), options.decimals))
      ])
    );
  }

  return erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: CAKE_ADDRESS,
      symbol: 'CAKE',
      decimals: 18
    },
    snapshot
  );
}
