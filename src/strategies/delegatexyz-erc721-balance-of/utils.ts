import { Address, DelegatedMapping, AddressScore } from './types';

export const lowerCaseAddress = (address: Address) =>
  address.toLowerCase() as Address;

export const calculateVotingPower = (
  inputAddresses: Address[],
  addressScores: AddressScore,
  walletMapping: DelegatedMapping
) => {
  const userVotingPower = {};
  inputAddresses.map((address: Address) => {
    let count = 0.0;
    walletMapping[lowerCaseAddress(address)].map((address: Address) => {
      count += addressScores[address];
    });
    userVotingPower[address] = count;
  });
  return userVotingPower;
};
