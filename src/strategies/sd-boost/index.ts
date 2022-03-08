import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'clement-ux';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

const veSDT = '0x0C30476f66034E11782938DF8e4384970B6c9e8a';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const F1 = 0.4;
  const F2 = 0.6;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  // Get V : total Liquid Locker voting power
  multi.call('balanceOf', options.veToken, 'balanceOf', [options.lockerToken]);
  const V_ = await multi.execute();
  const V = Number(V_.balanceOf);

  // Get W : total veSDT supply
  multi.call('totalSupply', veSDT, 'totalSupply', []);
  const W_ = await multi.execute();
  const W = Number(W_.totalSupply);

  // Get Bs : total balance of staked sdToken
  multi.call('totalSupply', options.gauge, 'totalSupply', []);
  const Bs_ = await multi.execute();
  const Bs = Number(Bs_.totalSupply);

  // Get w_u : user veSDT balance
  // Get b_u : user balance of staked sdToken
  const multi_wu = new Multicaller(network, provider, abi, { blockTag });
  const multi_bus = new Multicaller(network, provider, abi, { blockTag });
  const multi_buu = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) => {
    multi_wu.call(address, veSDT, 'balanceOf', [address]);
    multi_bus.call(address, options.sdToken, 'balanceOf', [address]);
    multi_buu.call(address, options.gauge, 'balanceOf', [address]);
  });
  const w_u: Record<string, BigNumberish> = await multi_wu.execute();
  const b_us: Record<string, BigNumberish> = await multi_bus.execute();
  const b_uu: Record<string, BigNumberish> = await multi_buu.execute();

  const b_u = {};
  addresses.forEach((address) => {
    b_u[address] = BigInt(Number(b_uu[address]) + Number(b_us[address]));
  });

  // Get beta_u = user adjusted balance of staked sdToken
  const beta_u = {};
  addresses.forEach((address) => {
    beta_u[address] = BigInt(
      Math.min(
        F1 * Number(b_u[address]) + F2 * Bs * (Number(w_u[address]) / W),
        Number(b_u[address])
      )
    );
  });

  // Get Eb_u : sum of all user adjusted balance of staked sdToken
  let Eb_u = BigInt(0);
  addresses.forEach((address) => {
    Eb_u += beta_u[address];
  });

  // Get v_u : user voting power
  const v_u = {};
  addresses.forEach((address) => {
    v_u[address] =
      Number(Eb_u) > 0
        ? BigInt((Number(beta_u[address]) * V) / Number(Eb_u))
        : 0;
  });

  // Final Result
  const finalResult: Record<string, BigNumberish> = v_u;

  return Object.fromEntries(
    Object.entries(finalResult).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
