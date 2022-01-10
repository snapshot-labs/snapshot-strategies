// import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
// import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'zencephalon';
export const version = '0.0.0';

const address = {
  dog: '0xBAac2B4491727D78D2b78815144570b9f2Fe8899'
};

const abi = {
  erc20: [
    'function balanceOf(address account) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)'
  ]
};

// type MultiCallResult = Record<string, BigNumberish>;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const makeMulticaller = (abi, contractAddress) => {
    const multiCaller = new Multicaller(network, provider, abi, {
      blockTag
    });
    addresses.forEach((address) =>
      multiCaller.call(address, contractAddress, 'balanceOf', [address])
    );
    return multiCaller;
  };

  const dogMulti = makeMulticaller(abi.erc20, address.dog);

  const [dogBalances] = await Promise.all([dogMulti.execute()]);

  return dogBalances;
}
