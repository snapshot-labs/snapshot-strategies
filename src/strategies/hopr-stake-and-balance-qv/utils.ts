import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import { parseUnits } from '@ethersproject/units';

/*
 ******************************************
 ****************** TYPES *****************
 ******************************************
 */
// details of a safe created by the NodeSafeFactory contract
export type Safe = {
  safeAddress: string;
  owners: string[];
  nodes: string[];
};

/*
 ******************************************
 *************** PARAMETERS ***************
 ******************************************
 */
const QUERY_LIMIT = 1000; // 1000 addresses per query in Subgraph

/*
 ***********************************************
 **************** SUBGRAPH SETUP ***************
 ***********************************************
 */
export function getStudioProdSubgraphUrl(
  apiKey: string | null | undefined,
  subgraphId: string
): string | null {
  return !apiKey
    ? null
    : `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId}`;
}

export function getStudioDevSubgraphUrl(
  accountStudioId: string | null | undefined,
  subgraphName: string,
  version: string
): string | null {
  return !accountStudioId
    ? null
    : `https://api.studio.thegraph.com/query/${accountStudioId}/${subgraphName}/${version}`;
}

export function getHostedSubgraphUrl(
  accountName: string,
  subgraphName: string | null
): string | null {
  return !subgraphName
    ? null
    : `https://api.thegraph.com/subgraphs/name/${accountName}/${subgraphName}`;
}

/**
 * Try to query subgraphs from three differnt endpoints (hosted service, studio for development, studio in production), if applicable
 * @param hostedSubgraphUrl hosted subgrpah url
 * @param stuidoDevSubgraphUrl development url foro studio subgraph
 * @param studioProdSubgraphUrl production url foro studio subgraph
 * @param builtQuery query object
 * @returns null or an object of summed token balance per address
 */
export async function subgraphRequestsToVariousServices(
  hostedSubgraphUrl: string | null,
  stuidoDevSubgraphUrl: string | null,
  studioProdSubgraphUrl: string | null,
  builtQuery: any
): Promise<any> {
  if (hostedSubgraphUrl) {
    try {
      // first try with hosted service
      return subgraphRequest(hostedSubgraphUrl, builtQuery);
    } catch (error) {
      // console.log('Failed to get data from hostedSubgraphUrl');
    }
  }

  // then try with studio dev service
  if (stuidoDevSubgraphUrl) {
    try {
      return subgraphRequest(stuidoDevSubgraphUrl, builtQuery);
    } catch (error) {
      // console.log('Failed to get data from stuidoDevSubgraphUrl');
    }
  }

  // then try with studio prod service
  if (studioProdSubgraphUrl) {
    try {
      return subgraphRequest(studioProdSubgraphUrl, builtQuery);
    } catch (error) {
      // console.log('Failed to get data from studioProdSubgraphUrl');
    }
  }
  return null;
}

/*
 *************************************************
 **************** SUBGRAPH QUERIES ***************
 *************************************************
 */
/**
 * Get block number from Gnosis chain at a given timestamp.
 * The timestamp of the returned block should be no-bigger than the desired timestamp
 * @param queryUrl URL to the subgraph query URL
 * @param timestamp number of timestamp
 * @param fallbackBlockNumber fallback block number on Gnosis chain, in case no result gets returned.
 * @returns a number
 */
export async function getGnosisBlockNumber(
  queryUrl: string,
  timestamp: number,
  fallbackBlockNumber: number
): Promise<number> {
  const query = {
    blocks: {
      __args: {
        first: 1,
        orderBy: 'number',
        orderDirection: 'desc',
        where: {
          timestamp_lte: timestamp
        }
      },
      number: true,
      timestamp: true
    }
  };

  // query from subgraph
  const data = await subgraphRequestsToVariousServices(
    queryUrl,
    null,
    null,
    query
  );
  return !data ? fallbackBlockNumber : Number(data.blocks[0].number);
}

/**
 * Get the list of safe address created by the HoprStakeFactory contract
 * where the voting account is an owner.
 * It also returns the share per owner (1 / total number of owners) of each safe.
 * @param hostedSubgraphUrl url to the hosted subgraph
 * @param stuidoDevSubgraphUrl url to the dev subgraph in the studio
 * @param studioProdSubgraphUrl url to the production subgraph in the studio
 * @param addresses address of voting accounts, which is an owner of the safe
 * @param blockNumber block number of the snapshot
 * @param snapshot snapshot
 * @returns a key-value object where the key is safe address the value is the total number of owners.
 */
export async function safeStakeSubgraphQuery(
  hostedSubgraphUrl: string | null,
  stuidoDevSubgraphUrl: string | null,
  studioProdSubgraphUrl: string | null,
  addresses: string[],
  blockNumber: number,
  snapshot: number | string
): Promise<Safe[]> {
  const query = {
    safes: {
      __args: {
        first: QUERY_LIMIT,
        where: {
          owners_: {
            owner_in: addresses.map((adr) => adr.toLowerCase())
          }
        }
      },
      id: true,
      owners: {
        owner: {
          id: true
        }
      },
      registeredNodesInNetworkRegistry: {
        node: {
          id: true
        }
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    query.safes.__args.block = { number: blockNumber };
  }

  // query from subgraph
  const data = await subgraphRequestsToVariousServices(
    hostedSubgraphUrl,
    stuidoDevSubgraphUrl,
    studioProdSubgraphUrl,
    query
  );

  // return parsed entries
  if (!data || !data.safes || data.safe.length == 0) {
    return [];
  } else {
    return data.safes.map((s) => {
      return {
        safeAddress: s.id,
        owners: s.owners.map((o) => o.owner.id),
        nodes: s.registeredNodesInNetworkRegistry.map((n) => n.node.id)
      } as Safe;
    });
  }
}

/**
 * Get the list of wxHOPR + xHOPR balance of addresses on Gnosis chain
 * @param hostedSubgraphUrl url to the hosted subgraph
 * @param stuidoDevSubgraphUrl url to the dev subgraph in the studio
 * @param studioProdSubgraphUrl url to the production subgraph in the studio
 * @param addresses address of wallets
 * @param blockNumber block number of the snapshot
 * @param snapshot snapshot
 * @returns a key-value object where the key is the address and the value is the total HOPR token balance on Gnosis chain.
 */
export async function hoprTotalOnGnosisSubgraphQuery(
  hostedSubgraphUrl: string | null,
  stuidoDevSubgraphUrl: string | null,
  studioProdSubgraphUrl: string | null,
  addresses: string[],
  blockNumber: number,
  snapshot: number | string
): Promise<{ [propName: string]: BigNumber }> {
  const query = {
    accounts: {
      __args: {
        first: QUERY_LIMIT,
        where: {
          id_in: addresses.map((adr) => adr.toLowerCase())
        }
      },
      id: true,
      totalBalance: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    query.accounts.__args.block = { number: blockNumber };
  }

  // query from subgraph
  const data = await subgraphRequestsToVariousServices(
    hostedSubgraphUrl,
    stuidoDevSubgraphUrl,
    studioProdSubgraphUrl,
    query
  );

  // map result (data.accounts) to addresses
  const entries = !data
    ? addresses.map((addr) => [addr, BigNumber.from('0')])
    : data.accounts.map((d) => [
        d.id,
        parseUnits(d.totalBalance.toString(), 18)
      ]);
  return Object.fromEntries(entries);
}

/**
 * Get the total stake in all the outgoing channels per node
 * @param hostedSubgraphUrl url to the hosted subgraph
 * @param stuidoDevSubgraphUrl url to the dev subgraph in the studio
 * @param studioProdSubgraphUrl url to the production subgraph in the studio
 * @param addresses node addresses
 * @param blockNumber block number of the snapshot
 * @param snapshot snapshot
 * @returns a key-value object where the key is the address and the value is the total HOPR token balance on Gnosis chain.
 */
export async function hoprNodeStakeOnChannelsSubgraphQuery(
  hostedSubgraphUrl: string | null,
  stuidoDevSubgraphUrl: string | null,
  studioProdSubgraphUrl: string | null,
  addresses: string[],
  blockNumber: number,
  snapshot: number | string
): Promise<{ [propName: string]: BigNumber }> {
  const query = {
    accounts: {
      __args: {
        first: QUERY_LIMIT,
        where: {
          id_in: addresses.map((adr) => adr.toLowerCase())
        }
      },
      id: true,
      balance: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    query.accounts.__args.block = { number: blockNumber };
  }

  // query from subgraph
  const data = await subgraphRequestsToVariousServices(
    hostedSubgraphUrl,
    stuidoDevSubgraphUrl,
    studioProdSubgraphUrl,
    query
  );

  // map result (data.accounts) to addresses
  const entries = !data
    ? addresses.map((addr) => [addr, BigNumber.from('0')])
    : data.accounts.map((d) => [
        d.id,
        parseUnits(d.totalBalance.toString(), 18)
      ]);
  return Object.fromEntries(entries);
}

/*
 ***********************************************
 ******************** OTHERS *******************
 ***********************************************
 */
export function trimArray<T>(
  originalArray: Array<T>,
  size: number = QUERY_LIMIT
): Array<Array<T>> {
  return Array.apply(null, Array(Math.ceil(originalArray.length / size))).map(
    (_e, i) => originalArray.slice(i * size, (i + 1) * size)
  );
}
