import { BigNumber } from '@ethersproject/bignumber';
// import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'zencephalon';
export const version = '0.0.0';

const contract = {
  dog: '0xBAac2B4491727D78D2b78815144570b9f2Fe8899', // 18 decimals
  fdog: '0x6e0e0bec375446ddcd196bdf291c41525fb95438', // 18 decimals, 5x mint ratio
  sSnoop: '0x7597c90c98b611e5d5db0671180d92189b90c6c6', // 9 decimals
  snoop: '0x8715ca97c5b464c1957cefbd18015b5567e52060' // 9 decimals
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

  const dogMulti = makeMulticaller(abi.erc20, contract.dog);
  const fdogMulti = makeMulticaller(abi.erc20, contract.fdog);
  const snoopMulti = makeMulticaller(abi.erc20, contract.snoop);
  const sSnoopMulti = makeMulticaller(abi.erc20, contract.sSnoop);

  const [
    dogBalances,
    fDogBalances,
    snoopBalances,
    sSnoopBalances
  ] = await Promise.all([
    dogMulti.execute(),
    fdogMulti.execute(),
    snoopMulti.execute(),
    sSnoopMulti.execute()
  ]);

  console.log(dogBalances);
  const votes = {};

  for (const a of addresses) {
    votes[a] = dogBalances[a].div(BigNumber.from(10).pow(18)).toNumber() || 0;
    votes[a] +=
      fDogBalances[a].div(BigNumber.from(10).pow(18)).div(5).toNumber() || 0;
    votes[a] += snoopBalances[a].div(BigNumber.from(10).pow(9)).toNumber() || 0;
    votes[a] +=
      sSnoopBalances[a].div(BigNumber.from(10).pow(9)).toNumber() || 0;
  }

  return votes;
}
