// import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = '0xEntropy';
export const version = '0.1.0';


const abi = [
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
  },
  {
    inputs: [],
    name: 'getPricePerFullShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
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

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('lpTotalSupply', options.lpToken, 'totalSupply', []);
  multi.call('creditInLp', options.address, 'balanceOf', [options.lpToken]);
  multi.call('pricePerShare', options.crypt, 'getPricePerFullShare', []);
  addresses.forEach((address: any) => {
    multi.call(`chef.${address}`, options.masterchef, 'getUserInfo', [
      options.pid,
      address
    ]);
    multi.call(`lp.${address}`, options.lpToken, 'balanceOf', [address]);
    multi.call(`reaper.${address}`, options.crypt, 'balanceOf', [address]);
  });
  const result = await multi.execute();
  const creditInLp = parseFloat(
    formatUnits(result.creditInLp, options.decimals)
  );
  const lpTotalSupply = parseFloat(formatUnits(result.lpTotalSupply));
  const creditPerLp = creditInLp / lpTotalSupply;

  return Object.fromEntries(
    addresses.map((address) => {
      const reaperVal = result.reaper[address];
      const raw = reaperVal.div(result.pricePerShare);
      return [
        address,
        parseFloat(formatUnits(result.lp[address])) * creditPerLp +
          parseFloat(formatUnits(result.chef[address].amount)) * creditPerLp +
          parseFloat(formatUnits(raw)) * creditPerLp
      ];
    })
  );
}
