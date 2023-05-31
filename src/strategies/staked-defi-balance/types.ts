// src/strategies/staked-defi-balance/types.ts

export interface ABI {
  inputs: {
    internalType: string;
    name: 'id' | 'staker' | 'account';
    type: string;
  }[];
  name: string;
  outputs: {
    internalType: string;
    name: string;
    type: string;
  }[];
  stateMutability: string;
  type: string;
}
