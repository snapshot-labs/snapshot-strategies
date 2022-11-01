import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'gmtesla';
export const version = '0.1.1';

// const DSLA = '0x3aFfCCa64c2A6f4e3B6Bd9c64CD2C969EFd1ECBe';
// const StakingSLA = '0x091ee4d4D8FfD00698c003C21F1ba69EA6310241';
// const LP_TOKEN = '0xAC104C0438A7bb15C714503537c6FA271FDB284E';  // dpToken
// const SP_TOKEN = '0xcf4ea46eba95fe3643b6c954d29516d7376913dc'   // duToken

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function usersPool(address token) external view returns (uint256)',
  'function providersPool(address token) external view returns (uint256)'
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

  // Get dpToken Balances
  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.LP_TOKEN, 'balanceOf', [address])
  );
  const dpTokenBalances: Record<string, BigNumberish> = await multi.execute();

  // Get duToken Balances
  addresses.forEach((address) =>
    multi.call(address, options.SP_TOKEN, 'balanceOf', [address])
  );
  const duTokenBalances: Record<string, BigNumberish> = await multi.execute();

  // Get totalSupply of user/provider pools
  const multi2 = new Multicaller(network, provider, abi, { blockTag });
  multi2.call('userTotalSupply', options.LP_TOKEN, 'totalSupply', []);
  multi2.call('providerTotalSupply', options.SP_TOKEN, 'totalSupply', []);
  multi2.call('usersPool', options.StakingSLA, 'usersPool', [options.DSLA]);
  multi2.call('providersPool', options.StakingSLA, 'providersPool', [options.DSLA]);
  const res2: Record<string, BigNumberish> = await multi2.execute();

  // Sum up duTokenBalance and dpTokenBalances
  // dTokenBalance = staked amount * total supply / (userPools or providerPools)
  // staked amount = dTokenBalance * (userPools or providerPools) / total supply
  const balances = Object.fromEntries(
    Object.entries(dpTokenBalances).map(([address, balance]) => [
      address,
      BigNumber.from(balance).mul(res2.providersPool).div(res2.providerTotalSupply)
    ])
  );
  Object.entries(duTokenBalances).forEach(([address, balance]) => {
    const prevBal = BigNumber.from(balances[address]);
    balances[address] = prevBal.add(
      BigNumber.from(balance).mul(res2.usersPool).div(res2.userTotalSupply)
    );
  })

  const result = Object.fromEntries(
    Object.entries(balances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );

  return result;
}
