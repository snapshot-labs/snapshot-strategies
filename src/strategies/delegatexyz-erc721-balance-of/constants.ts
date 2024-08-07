export const abi = [
  'function getIncomingDelegations(address to) view returns (tuple(uint8 type_, address to, address from, bytes32 rights, address contract_, uint256 tokenId, uint256 amount)[] delegations_)',
  'function getOutgoingDelegations(address from) view returns (tuple(uint8 type_, address to, address from, bytes32 rights, address contract_, uint256 tokenId, uint256 amount)[] delegations_)'
];

export const delegatexyzV2ContractAddress =
  '0x00000000000000447e69651d841bd8d104bed493';
