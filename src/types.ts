export type VpState = 'final' | 'pending';
export type Score = Record<string, number>;
export type VotingPower = {
  vp: number;
  vp_by_strategy: number[];
  vp_state: VpState;
};
export type Snapshot = number | 'latest';
export type Protocol = 'evm' | 'starknet';
