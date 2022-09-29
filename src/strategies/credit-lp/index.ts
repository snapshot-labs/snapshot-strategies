// import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = '0xEntropy';
export const version = '0.1.0';

const abi = [
  'function getUserInfo(uint256 _pid, address _user) view returns (tuple(uint256 amount, uint256[] RewardDebt, uint256[] RemainingRewards))',
  'function getPricePerFullShare() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
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
