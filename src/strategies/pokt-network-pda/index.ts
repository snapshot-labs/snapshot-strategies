import fetch from 'cross-fetch';
import { subgraphRequest } from '../../utils';
import { EnumType } from 'json-to-graphql-query';

// Interfaces
interface PoktNetworkOptions {
  arweave_network: 'MAINNET' | 'DEVNET';
  owner_address: string;
  decimals: number;
  multiply: number;
}

interface ArweaveBlockResponse {
  transactions: {
    edges: [
      {
        node: {
          id: string;
        };
      }
    ];
  };
}

interface StoreDomainBlock {
  point: number;
  PDAs: string;
}

interface StakerDomainBlock<Block> {
  validator?: Block;
  gateway?: Block;
  'liquidity provider'?: Block;
}

interface PDAScores {
  [walletAddress: string]: {
    citizen?: StoreDomainBlock;
    builder?: StoreDomainBlock;
    staker?: StakerDomainBlock<StoreDomainBlock>;
  };
}

interface SumHousesPoints {
  builder_points: number;
  validator_and_liquidity_provider_points: number;
  gateway_points: number;
}

// Major constants
export const author = 'Microflow-xyz';
export const version = '0.1.0';
// Constants
const IRYS_NETWORK_GRAPHQL_URL = {
  MAINNET: 'https://node1.irys.xyz/graphql',
  DEVNET: 'https://devnet.irys.xyz/graphql'
};
const ARWEAVE_BASE_URL = 'https://arweave.net';
const ARWEAVE_POKT_NETWORK_TAGS = [
  { name: 'Content-Type', values: ['application/json'] },
  { name: 'Application-ID', values: ['POKT-NETWORK-PDA-SCORING-SYSTEM'] },
  { name: 'Data-ID', values: ['PDAs-SCORES'] }
];
const HOUSE_SHARES = {
  builder: 0.8,
  staker: 0.2
};
const STAKER_HOUSE_SHARES = {
  validator_and_liquidity_provider: 0.5,
  gateway: 0.5
};

function calculateSumHousesPoints(PDAScores: PDAScores): SumHousesPoints {
  const result = {
    builder_points: 0,
    validator_and_liquidity_provider_points: 0,
    gateway_points: 0
  };

  for (const walletAddr in PDAScores) {
    if (Object.prototype.hasOwnProperty.call(PDAScores, walletAddr)) {
      const scoreBlock = PDAScores[walletAddr];
      const builderHouse = scoreBlock.builder;
      const stakerHouse = scoreBlock.staker;
      const citizenHouse = scoreBlock.citizen;

      if (citizenHouse && citizenHouse.point > 0) {
        if (builderHouse && builderHouse.point > 0) {
          result.builder_points += 1;
        }

        if (stakerHouse) {
          const validatorHouse = stakerHouse.validator;
          const gatewayHouse = stakerHouse.gateway;
          const liquidityProviderHouse = stakerHouse['liquidity provider'];

          if (validatorHouse || liquidityProviderHouse) {
            const validatorHousePoint = validatorHouse?.point || 0;
            const liquidityProviderHousePoint =
              liquidityProviderHouse?.point || 0;

            result.validator_and_liquidity_provider_points += Math.sqrt(
              validatorHousePoint + liquidityProviderHousePoint
            );
          }

          if (gatewayHouse && gatewayHouse.point > 0) {
            result.gateway_points += Math.sqrt(gatewayHouse.point);
          }
        }
      }
    }
  }

  return result;
}

function calculateHousesPower(
  PDAScores: PDAScores,
  powers: Record<string, number>,
  sumHousesPoints: SumHousesPoints
) {
  for (const walletAddr in powers) {
    if (Object.prototype.hasOwnProperty.call(powers, walletAddr)) {
      if (walletAddr in PDAScores) {
        const scoreBlock = PDAScores[walletAddr];
        const builderHouse = scoreBlock.builder;
        const stakerHouse = scoreBlock.staker;
        const citizenHouse = scoreBlock.citizen;

        if (citizenHouse && citizenHouse.point > 0) {
          if (builderHouse && builderHouse.point > 0) {
            powers[walletAddr] +=
              (1 / sumHousesPoints.builder_points) * HOUSE_SHARES.builder;
          }

          if (stakerHouse) {
            const validatorHouse = stakerHouse.validator;
            const gatewayHouse = stakerHouse.gateway;
            const liquidityProviderHouse = stakerHouse['liquidity provider'];

            if (validatorHouse || liquidityProviderHouse) {
              const validatorHousePoint = validatorHouse?.point || 0;
              const liquidityProviderHousePoint =
                liquidityProviderHouse?.point || 0;

              powers[walletAddr] +=
                (Math.sqrt(validatorHousePoint + liquidityProviderHousePoint) /
                  sumHousesPoints.validator_and_liquidity_provider_points) *
                STAKER_HOUSE_SHARES.validator_and_liquidity_provider *
                HOUSE_SHARES.staker;
            }

            if (gatewayHouse && gatewayHouse.point > 0) {
              powers[walletAddr] +=
                (Math.sqrt(gatewayHouse.point) /
                  sumHousesPoints.gateway_points) *
                STAKER_HOUSE_SHARES.gateway *
                HOUSE_SHARES.staker;
            }
          }
        }
      }
    }
  }
}

async function getArweaveBlock(
  url: string,
  ownerAddress: string,
  timestamp: number
): Promise<ArweaveBlockResponse> {
  const query = {
    transactions: {
      __args: {
        tags: ARWEAVE_POKT_NETWORK_TAGS,
        owners: [ownerAddress],
        order: new EnumType('DESC'),
        first: 1,
        timestamp: { to: timestamp * 1000 }
      },
      edges: {
        node: {
          id: true
        }
      }
    }
  };

  return subgraphRequest(url, query);
}

async function getArweaveData(arweaveBlockID: string): Promise<PDAScores> {
  const arweaveDataURL = new URL(arweaveBlockID, ARWEAVE_BASE_URL);
  const response = await fetch(arweaveDataURL);

  return response.json();
}

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: Array<string>,
  options: PoktNetworkOptions,
  snapshot: string | number | undefined
): Promise<Record<string, number>> {
  const powers: Record<string, number> =
    Object.fromEntries(addresses.map((address) => [address, 0.0])) || {};

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const timestamp = (await provider.getBlock(blockTag)).timestamp;

  const arweaveBlock = await getArweaveBlock(
    IRYS_NETWORK_GRAPHQL_URL[options.arweave_network],
    options.owner_address,
    timestamp
  );
  const arweaveBlockID = arweaveBlock?.transactions?.edges?.[0]?.node?.id;

  if (arweaveBlockID) {
    const arweaveData = await getArweaveData(arweaveBlockID);

    const sumHousesPoints = calculateSumHousesPoints(arweaveData);
    calculateHousesPower(arweaveData, powers, sumHousesPoints);
  }

  return Object.keys(powers).reduce((current, key) => {
    current[key] = parseFloat(
      (powers[key] * 10 ** options.multiply).toFixed(options.decimals)
    );

    return current;
  }, {});
}
