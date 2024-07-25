export const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      }
    ],
    name: 'getIncomingDelegations',
    outputs: [
      {
        components: [
          {
            internalType: 'enum IDelegateRegistry.DelegationType',
            name: 'type_',
            type: 'uint8'
          },
          {
            internalType: 'address',
            name: 'to',
            type: 'address'
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address'
          },
          {
            internalType: 'bytes32',
            name: 'rights',
            type: 'bytes32'
          },
          {
            internalType: 'address',
            name: 'contract_',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          }
        ],
        internalType: 'struct IDelegateRegistry.Delegation[]',
        name: 'delegations_',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export const delegatexyzV2ContractAddress =
  '0x00000000000000447e69651d841bd8d104bed493';
