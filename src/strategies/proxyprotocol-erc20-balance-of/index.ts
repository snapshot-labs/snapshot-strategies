import fetch from 'cross-fetch';
import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'rawrjustin';
export const version = '0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const calculateVotingPower = (inputAddresses, addressScores, walletMap) => {
  let userVotingPower = {};
  inputAddresses.forEach(input => {
    let count = 0.0
    walletMap[input.toLowerCase()].forEach(address => {
      count += addressScores[address]
    });
    userVotingPower[input] = count
  });
  return userVotingPower
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Get the wallet mapping from proxy wallets to actual wallets
  const url = 'https://api.proxychat.xyz/external/v0/getProxyWalletMappings';
  const params = {
    proxyAddresses: addresses
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  const data = await response.json();

  // Flatten the wallet mapping so it's an array of real wallets to query for tokens
  var arrayOfProxyWallets = Object.keys(data).map(function(key){
    return data[key];
  });
  var flattenedWalletAddresses = [].concat.apply([], arrayOfProxyWallets);

  // Query for token holdings
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const multi = new Multicaller(network, provider, abi, { blockTag });
  flattenedWalletAddresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  const addressScores = Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );

  // Calculate the voting power across all wallets and map it back to original Proxy wallets.
  return calculateVotingPower(
    addresses,
    addressScores,
    data
  );
}
