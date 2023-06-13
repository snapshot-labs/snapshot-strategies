import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { formatUnits } from '@ethersproject/units';

export const author = 'taraxa';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

const abi = [
  'function getDelegations(address delegator, uint32 batch) view returns (tuple(address account, tuple(uint256 stake, uint256 rewards) delegation)[] delegations, bool end)'
];

export default interface Delegation {
  address: string;
  stake: BigNumber;
}

interface ContractDelegationInfo {
  rewards: BigNumber;
  stake: BigNumber;
}

export interface ContractDelegation {
  account: string;
  delegation: ContractDelegationInfo;
}

const getTotalDelegationOfAddress = async (
  address: string,
  provider: any,
  blockTag: string | number
): Promise<Delegation> => {
  const mainnetDpos = new Contract(
    '0x00000000000000000000000000000000000000fe',
    abi,
    provider
  );

  let newDelegations: ContractDelegation[] = [];
  let page = 0;
  let hasNextPage = true;
  while (hasNextPage) {
    try {
      const allDelegations = await mainnetDpos!.getDelegations(address, page, {
        blockTag
      });

      newDelegations = [...newDelegations, ...allDelegations.delegations];
      hasNextPage = !allDelegations.end;
      page++;
    } catch (e) {
      console.error(e);
      hasNextPage = false;
    }
  }

  const finalDelegations = newDelegations.map(
    (delegation: ContractDelegation) => ({
      address: delegation.account,
      stake: delegation.delegation.stake,
      rewards: delegation.delegation.rewards
    })
  );
  return {
    address,
    stake: finalDelegations
      .map((s) => s.stake)
      .reduce((a, b) => a.add(b), BigNumber.from(0))
  };
};

const getDelegations = async (
  addresses,
  provider,
  snapshot
): Promise<Record<string, number>> => {
  let result: Record<string, BigNumberish> = {};
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  for (const address of addresses) {
    const delegation = await getTotalDelegationOfAddress(
      address,
      provider,
      blockTag
    );
    result[address] = delegation.stake;
  }
  return Object.fromEntries(
    Object.entries(result).map(([address, stake]) => [
      address,
      parseFloat(formatUnits(stake, 18))
    ])
  );
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegations = await getDelegations(addresses, provider, snapshot);
  if (Object.keys(delegations).length === 0) return {};

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address] ? delegations[address] : 0;
      return [address, addressScore];
    })
  );
}
