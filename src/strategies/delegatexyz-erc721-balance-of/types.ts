import { BigNumber } from '@ethersproject/bignumber';
import { Bytes } from '@ethersproject/bytes';

export type Address = `0x${string}`;

export enum DelegationType {
  NONE,
  ALL,
  CONTRACT,
  ERC721,
  ERC20,
  ERC1155
}

export interface Delegation {
  type_: DelegationType;
  to: Address;
  from: Address;
  rights: Bytes;
  contract_: Address;
  tokenId: BigNumber;
  amount: BigNumber;
}

export interface DelegationStruct {
  _: Delegation[];
  delegations_: Delegation[];
}

export interface DelegatedMapping {
  [key: Address]: Address[];
}

export interface AddressScore {
  [key: Address]: number;
}
