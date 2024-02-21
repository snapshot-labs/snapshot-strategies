/**
 * ------------------------------------------------------
 * SABLIER V2 CONSTANTS
 * ------------------------------------------------------
 */

const chains = {
  arbitrum: '42161',
  avalanche: '43114',
  base: '8453',
  bsc: '56',
  ethereum: '1',
  goerli: '5',
  gnosis: '100',
  optimism: '10',
  optimismSepolia: '11155420',
  polygon: '137',
  scroll: '534352',
  sepolia: '11155111'
};

const deployments = {
  [chains.arbitrum]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-arbitrum'
  },
  [chains.avalanche]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-avalanche'
  },
  [chains.base]: {
    subgraph:
      'https://api.studio.thegraph.com/query/57079/sablier-v2-base/version/latest'
  },
  [chains.bsc]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-bsc'
  },
  [chains.ethereum]: {
    subgraph: 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2'
  },
  [chains.goerli]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-goerli'
  },
  [chains.gnosis]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-gnosis'
  },
  [chains.optimism]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-optimism'
  },
  [chains.optimismSepolia]: {
    subgraph:
      'https://api.studio.thegraph.com/query/57079/sablier-v2-optimism-sepolia/version/latest'
  },
  [chains.polygon]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-polygon'
  },
  [chains.scroll]: {
    subgraph:
      'https://api.studio.thegraph.com/query/57079/sablier-v2-scroll/version/latest'
  },
  [chains.sepolia]: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-v2-sepolia'
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
