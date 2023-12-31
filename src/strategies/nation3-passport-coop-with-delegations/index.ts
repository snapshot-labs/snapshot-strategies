import { getAddress } from '@ethersproject/address';
import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'nation3';
export const version = '0.3.0';

const DECIMALS = 18;

const balanceAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const erc20BalanceCaller = new Multicaller(network, provider, balanceAbi, {
    blockTag
  });

  const erc721BalanceCaller = new Multicaller(network, provider, balanceAbi, {
    blockTag
  });

  const passportIssuanceSubgrgraph = "https://api.thegraph.com/subgraphs/name/nation3/passportissuance"

  const revokedUsersResponse = await subgraphRequest(passportIssuanceSubgrgraph, {
    revokes: {
      __args: {
        where: { _to_in: addresses }
      },
      id: true,
      _to: true
    }
  });

  const revokedUsers: string[] = revokedUsersResponse.revokes.map(revokeObject => {
    return getAddress(revokeObject._to);
  });


  const eligibleAddresses: string[] = addresses.filter((address) => {
    return !revokedUsers.includes(getAddress(address));
  });


  eligibleAddresses.forEach((owner) =>
    erc20BalanceCaller.call(owner, options.erc20, 'balanceOf', [owner])
  );

  const erc20Balances: Record<string, BigNumberish> =
    await erc20BalanceCaller.execute();


  eligibleAddresses.forEach((owner) =>
    erc721BalanceCaller.call(owner, options.erc721, 'balanceOf', [owner])
  );

  const erc721Balances: Record<string, BigNumberish> =
    await erc721BalanceCaller.execute();


  const eligibleAddressesWithPassports = eligibleAddresses.filter((owner) => {
    const passportBalance = erc721Balances[owner] || 0;
    return parseFloat(formatUnits(passportBalance, DECIMALS)) > 0;
  });

  //now we have balances, need to check for > 1.5 on all IDs that have voted
  const withPower = eligibleAddressesWithPassports.filter((owner) => {
    const veNationBalance = erc20Balances[owner] || 0;

    return parseFloat(formatUnits(veNationBalance, DECIMALS)) > 1.5;
  });

  return Object.fromEntries(withPower.map(([, signer]) => [signer, 1]));
}
