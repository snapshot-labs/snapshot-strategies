export const testConfig = {
  network: '1',
  snapshot: 15354134,
  space: 'cvx.eth',
  evmAddress: '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
  starknetAddress:
    '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A'
};

export const strategies = {
  withDelegation: [
    {
      name: 'erc20-balance-of',
      params: {
        symbol: 'CVX',
        address: '0x72a19342e8F1838460eBFCCEf09F6585e32db86E',
        decimals: 18
      }
    },
    {
      name: 'eth-balance',
      network: '100',
      params: {}
    },
    {
      name: 'eth-balance',
      network: '1',
      params: {}
    },
    {
      name: 'eth-balance',
      network: '10',
      params: {}
    }
  ],
  mixed: [
    {
      name: 'whitelist',
      params: {
        addresses: [testConfig.evmAddress, testConfig.starknetAddress]
      }
    },
    {
      name: 'eth-balance',
      network: '100',
      params: {}
    }
  ],
  evmOnly: [
    {
      name: 'eth-balance',
      network: '100',
      params: {}
    }
  ],
  singleInvalid: [
    {
      name: 'whitelist-invalid',
      params: {
        addresses: [testConfig.evmAddress, testConfig.starknetAddress]
      }
    },
    {
      name: 'eth-balance',
      network: '100',
      params: {}
    }
  ],
  multipleInvalid: [
    {
      name: 'strategy-one-invalid',
      params: {}
    },
    {
      name: 'strategy-two-invalid',
      params: {}
    },
    {
      name: 'eth-balance',
      network: '100',
      params: {}
    }
  ]
};
