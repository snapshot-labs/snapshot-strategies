import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'deversifi';
export const version = '0.1.0';

const vestedABI = ['function delegateForVoting() view returns (address)'];

const xDVFABI = ['function balanceOf(address account) view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const { vestedContracts, xDVFAddress, decimals } = options;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const lowerCaseAddresses = {};
  addresses.forEach(
    (item: any) => (lowerCaseAddresses[item.toLowerCase()] = true)
  );

  let beneficiaries = await multicall(
    network,
    provider,
    vestedABI,
    vestedContracts.map((address: any) => [address, 'delegateForVoting', []]),
    { blockTag }
  );

  if (beneficiaries.length > 0) {
    beneficiaries = beneficiaries
      .map((item, index) => ({
        beneficiary: item[0],
        vestedContract: vestedContracts[index]
      }))
      .filter(
        (item: any) => lowerCaseAddresses[item.beneficiary.toLowerCase()]
      );

    const balances = await multicall(
      network,
      provider,
      xDVFABI,
      beneficiaries.map((item: any) => [
        xDVFAddress,
        'balanceOf',
        [item.vestedContract]
      ])
    );

    return Object.fromEntries(
      beneficiaries.map((b, i) => [
        b.beneficiary,
        parseFloat(formatUnits(balances[i].toString(), decimals))
      ])
    );
  }

  return {};
}
