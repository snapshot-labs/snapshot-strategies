/**
 * ------------------------------------------------------
 * SABLIER V2 CONSTANTS
 * ------------------------------------------------------
 */

const chains = {
  arbitrum: '42161',
  avalanche: '43114',
  bsc: '56',
  ethereum: '1',
  goerli: '5',
  gnosis: '100',
  optimism: '10',
  polygon: '137'
};

const deployments = {
  [chains.arbitrum]: {
    contracts: [
      '0x197d655f3be03903fd25e7828c3534504bfe525e', // SablierV2LockupLinear
      '0xa9efbef1a35ff80041f567391bdc9813b2d50197' // SablierV2LockupDynamic
    ],
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-arbitrum'
  },
  [chains.avalanche]: {
    contracts: [
      '0x610346e9088afa70d6b03e96a800b3267e75ca19', // SablierV2LockupLinear
      '0x665d1c8337f1035cfbe13dd94bb669110b975f5f' // SablierV2LockupDynamic
    ],
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-avalanche'
  },
  [chains.bsc]: {
    contracts: [
      '0x3fe4333f62a75c2a85c8211c6aefd1b9bfde6e51', // SablierV2LockupLinear
      '0xf2f3fef2454dca59eca929d2d8cd2a8669cc6214' // SablierV2LockupDynamic
    ],
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-bsc'
  },

  [chains.ethereum]: {
    contracts: [
      '0xb10daee1fcf62243ae27776d7a92d39dc8740f95', // SablierV2LockupLinear
      '0x39efdc3dbb57b2388ccc4bb40ac4cb1226bc9e44' // SablierV2LockupDynamic
    ],
    subgraph: 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2'
  },
  [chains.goerli]: {
    contracts: [
      '0x6e3678c005815ab34986d8d66a353cd3699103de', // SablierV2LockupLinear
      '0x4be70ede968e9dba12db42b9869bec66bedc17d7' // SablierV2LockupDynamic
    ],
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-goerli'
  },
  [chains.gnosis]: {
    contracts: [
      '0x685e92c9ca2bb23f1b596d0a7d749c0603e88585', // SablierV2LockupLinear
      '0xeb148e4ec13aaa65328c0ba089a278138e9e53f9' // SablierV2LockupDynamic
    ],
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-gnosis'
  },
  [chains.optimism]: {
    contracts: [
      '0xb923abdca17aed90eb5ec5e407bd37164f632bfd', // SablierV2LockupLinear
      '0x6f68516c21e248cddfaf4898e66b2b0adee0e0d6' // SablierV2LockupDynamic
    ],
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-optimism'
  },
  [chains.polygon]: {
    contracts: [
      '0x67422c3e36a908d5c3237e9cffeb40bde7060f6e', // SablierV2LockupLinear
      '0x7313addb53f96a4f710d3b91645c62b434190725' // SablierV2LockupDynamic
    ],
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-polygon'
  }
};

const abi = {
  getDepositedAmount:
    'function getDepositedAmount(uint256 streamId) external view returns (uint128 depositAmount)',
  streamedAmountOf:
    'function streamedAmountOf(uint256 streamId) external view returns (uint128 streamedAmount)',
  withdrawableAmountOf:
    'function withdrawableAmountOf(uint256 streamId) external view returns (uint128 withdrawableAmount)'
};

const page = 1000;

const policies = {
  'withdrawable-recipient': 'withdrawable-recipient',
  'reserved-recipient': 'reserved-recipient',
  'deposited-recipient': 'deposited-recipient',
  'deposited-sender': 'deposited-sender',
  'streamed-recipient': 'streamed-recipient',
  'unstreamed-recipient': 'unstreamed-recipient'
};

type IPolicy = typeof policies[keyof typeof policies];

interface IOptions {
  address: string;
  decimals: number;
  symbol?: string;
  policy: IPolicy;
}

/**
 * ------------------------------------------------------
 * SABLIER V2 SUBGRAPH QUERIES
 * ------------------------------------------------------
 */

/*
 * See the docs for more example queries:
 * https://docs.sablier.com/api/subgraphs/queries
 */

interface IStreamsByAssetParams {
  accounts: string[];
  asset: string;
  block: number;
  first?: number;
  skip?: number;
}

type IAccountMap = Map<
  string,
  {
    id: string;
    canceled: boolean;
    contract: string;
    deposited: string;
    withdrawn: string;
  }[]
>;

interface IStreamsByAssetResult {
  streams: {
    id: string;
    contract: {
      id: string;
    };
    canceled: boolean;
    proxied: boolean;
    proxender: string;
    recipient: string;
    sender: string;
    tokenId: string;
    depositAmount: string;
    withdrawnAmount: string;
  }[];
}

/** @returns Streams by recipient and asset/token at the given block */
const RecipientStreamsByAsset = ({
  asset,
  block,
  first = page,
  accounts,
  skip = 0
}: IStreamsByAssetParams) => ({
  streams: {
    __args: {
      block: { number: block },
      first,
      orderBy: 'timestamp',
      orderDirection: 'desc',
      skip,
      where: {
        asset,
        recipient_in: accounts
      }
    },
    id: true,
    contract: {
      id: true
    },
    canceled: true,
    recipient: true,
    sender: true,
    tokenId: true,
    depositAmount: true,
    withdrawnAmount: true
  }
});

/** @returns Streams by recipient and asset/token at the given block */
const SenderStreamsByAsset = ({
  asset,
  block,
  first = page,
  accounts,
  skip = 0
}: IStreamsByAssetParams) => ({
  streams: {
    __args: {
      block: { number: block },
      first,
      orderBy: 'timestamp',
      orderDirection: 'desc',
      skip,
      where: {
        or: [
          {
            and: [{ asset: asset }, { sender_in: accounts }]
          },
          {
            and: [{ asset: asset }, { proxender_in: accounts }]
          }
        ]
      }
    },
    id: true,
    contract: {
      id: true
    },
    canceled: true,
    proxied: true,
    proxender: true,
    recipient: true,
    sender: true,
    tokenId: true,
    depositAmount: true,
    withdrawnAmount: true
  }
});

const queries = { RecipientStreamsByAsset, SenderStreamsByAsset };

export type {
  IAccountMap,
  IOptions,
  IPolicy,
  IStreamsByAssetParams,
  IStreamsByAssetResult
};
export { abi, chains, deployments, page, policies, queries };
