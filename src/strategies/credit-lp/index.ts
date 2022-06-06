// import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = '0xEntropy';
export const version = '0.1.0';

const erc20Abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

const masterChefAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: '_pid', type: 'uint256' },
      { internalType: 'address', name: '_user', type: 'address' }
    ],
    name: 'getUserInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'uint256[]', name: 'RewardDebt', type: 'uint256[]' },
          {
            internalType: 'uint256[]',
            name: 'RemainingRewards',
            type: 'uint256[]'
          }
        ],
        internalType: 'struct SteakHouseV2.UserInfo',
        name: '',
        type: 'tuple'
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

  const tokenMulti = new Multicaller(network, provider, erc20Abi, { blockTag });
  tokenMulti.call('lpTotalSupply', options.lpToken, 'totalSupply', []);
  tokenMulti.call('creditInLp', options.address, 'balanceOf', [
    options.lpToken
  ]);
  const result = await tokenMulti.execute();
  const creditInLp = parseFloat(
    formatUnits(result.creditInLp, options.decimals)
  );
  const lpTotalSupply = parseFloat(formatUnits(result.lpTotalSupply));
  const creditPerLp = creditInLp / lpTotalSupply;
  const chefMulti = new Multicaller(network, provider, masterChefAbi, {
    blockTag
  });
  addresses.forEach((address: any) => {
    chefMulti.call(address, options.masterchef, 'getUserInfo', [
      options.pid,
      address
    ]);
  });
  const chefResult = await chefMulti.execute();
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      parseFloat(formatUnits(chefResult[address].amount)) * creditPerLp
    ])
  );
}
