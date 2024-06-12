/**
 * ------------------------------------------------------
 * SABLIER V2 CONSTANTS
 * ------------------------------------------------------
 */

const chains = {
  arbitrum: '42161',
  arbitrumSepolia: '421614',
  avalanche: '43114',
  base: '8453',
  blast: '81457',
  bsc: '56',
  ethereum: '1',
  gnosis: '100',
  optimism: '10',
  optimismSepolia: '11155420',
  polygon: '137',
  scroll: '534352',
  sepolia: '11155111',
  zkSync: '324'
};

const deployments = {
  [chains.ethereum]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/EuZZnhFtdCGqN2Zt7EMGYDqQKNrVuhJL63KAfwvF35bL'
  },
  [chains.arbitrumSepolia]: {
    subgraph:
      'https://api.studio.thegraph.com/query/57079/sablier-v2-arbitrum-sepolia/version/latest'
  },
  [chains.arbitrum]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/AR77w8PwmkAG7c9DJSsfW6yTrC5UdvdQ1Hz5ZTCuaUWz'
  },
  [chains.avalanche]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/FdVwZuMV43yCb1nPmjnLQwmzS58wvKuLMPzcZ4UWgWAc'
  },
  [chains.base]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/3pxjsW9rbDjmZpoQWzc5CAo4vzcyYE9YQyTghntmnb1K'
  },
  [chains.blast]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/BXoC2ToMZXnTmCjWftQRPh9zMyM7ysijMN54Nxzb2CEY'
  },
  [chains.bsc]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/BVyi15zcH5eUg5PPKfRDDesezMezh6cAkn8LPvh7MVAF'
  },
  [chains.gnosis]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/EXhNLbhCbsewJPx4jx5tutNXpxwdgng2kmX1J7w1bFyu'
  },
  [chains.optimism]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/6e6Dvs1yDpsWDDREZRqxGi54SVdvTNzUdKpKJxniKVrp'
  },
  [chains.optimismSepolia]: {
    subgraph:
      'https://api.studio.thegraph.com/query/57079/sablier-v2-optimism-sepolia/version/latest'
  },
  [chains.polygon]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/CsDNYv9XPUMP8vufuwDVKQrVhsxhzzRHezjLFFKZZbrx'
  },
  [chains.scroll]: {
    subgraph:
      'https://api.studio.thegraph.com/query/57079/sablier-v2-scroll/version/latest'
  },
  [chains.sepolia]: {
    subgraph:
      'https://api.studio.thegraph.com/query/57079/sablier-v2-sepolia/version/latest'
  },
  [chains.zkSync]: {
    subgraph:
      'https://subgrapher.snapshot.org/subgraph/arbitrum/GY2fGozmfZiZ3xF2MfevohLR4YGnyxGxAyxzi9zmU5bY'
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
