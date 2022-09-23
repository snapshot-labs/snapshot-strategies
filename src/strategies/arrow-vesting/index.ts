import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'BrassLion';
export const version = '0.1.0';

const vestingFactoryAbi = [
  'function escrows_length() public view returns (uint256)',
  'function escrows(uint256 index) public view returns (address)'
];

const vestingContractAbi = [
  'function recipient() public view returns (address)'
];

const tokenAbi = [
  'function balanceOf(address account) external view returns (uint256)'
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

  // Get all vesting contract addresses.
  const vestingFactory = new Contract(
    options.vestingFactory,
    vestingFactoryAbi,
    provider
  );

  const vestingContractCount = await vestingFactory.escrows_length();

  const vestingFactoryMulti = new Multicaller(
    network,
    provider,
    vestingFactoryAbi,
    { blockTag }
  );

  [...Array(vestingContractCount.toNumber()).keys()].forEach((contractIdx) => {
    vestingFactoryMulti.call(contractIdx, options.vestingFactory, 'escrows', [
      contractIdx
    ]);
  });

  const vestingContracts: Record<number, string> =
    await vestingFactoryMulti.execute();

  // Get all beneficiaries of vesting contracts.
  const vestingContractMulti = new Multicaller(
    network,
    provider,
    vestingContractAbi,
    { blockTag }
  );

  Object.values(vestingContracts).forEach((vestingContractAddress) => {
    vestingContractMulti.call(
      vestingContractAddress,
      vestingContractAddress,
      'recipient',
      []
    );
  });

  const vestingContractRecipients: Record<string, string> =
    await vestingContractMulti.execute();

  // Get all balances of vesting contracts.
  const tokenMulti = new Multicaller(network, provider, tokenAbi, { blockTag });

  Object.values(vestingContracts).forEach((vestingContractAddress) => {
    tokenMulti.call(vestingContractAddress, options.address, 'balanceOf', [
      vestingContractAddress
    ]);
  });

  const vestingContractBalances: Record<string, BigNumberish> =
    await tokenMulti.execute();

  // Sum all vesting contract balances by recipient over requested addresses.
  const addressBalances: Record<string, BigNumber> = {};

  addresses.forEach((address) => {
    addressBalances[address] = BigNumber.from(0);
  });

  Object.values(vestingContracts).forEach((vestingContractAddress) => {
    const recipient = vestingContractRecipients[vestingContractAddress];

    if (recipient in addressBalances) {
      addressBalances[recipient] = addressBalances[recipient].add(
        vestingContractBalances[vestingContractAddress]
      );
    }
  });

  return Object.fromEntries(
    Object.entries(addressBalances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
