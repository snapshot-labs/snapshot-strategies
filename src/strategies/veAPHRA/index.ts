import { formatUnits } from '@ethersproject/units';
import { Multicaller, subgraphRequest } from '../../utils';
import { BigNumberish } from '@ethersproject/bignumber';

export const author = 'androolloyd';
export const version = '0.1.0';
const SUBGRAPH_URL =
  'https://api.studio.thegraph.com/query/22984/veaphra/0.0.3';

const abi = [
  'function balanceOfAtNFT(uint,uint) external view returns (uint256)',
  'function balanceOfNFT(uint) external view returns (uint256)'
];
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const args: {
    where: { owner_in: string[] };
    block?: { number: number };
  } = {
    where: {
      owner_in: addresses.map((addr: string) => addr.toLowerCase())
    }
  };
  if (blockTag !== 'latest') args.block = { number: blockTag };

  const walletQueryParams = {
    nfts: {
      __args: {
        first: 10000
      },
      tokenID: true,
      tokenURI: true,
      ownership: {
        __args: args,
        owner: true
      }
    }
  };
  const subgraphResult: any = await subgraphRequest(SUBGRAPH_URL, {
    ...walletQueryParams
  });
  const method =
    typeof snapshot === 'number' ? 'balanceOfAtNFT' : 'balanceOfNFT';
  const multi = new Multicaller(network, provider, abi);
  const holders: any = [];
  subgraphResult.nfts.map((nft: any) => {
    const { tokenID, ownership } = nft;
    if (tokenID == '0' || !ownership.length) return;
    const owner = ownership[0].owner;
    holders.push(owner);
    if (addresses.indexOf(owner) == -1) return;
    const args = typeof snapshot === 'number' ? [tokenID, blockTag] : [tokenID];
    multi.call(owner, options.address, method, args);
  });
  const result: Record<string, BigNumberish> = await multi.execute();

  const formattedOut = {};
  Object.entries(result).map(([address, balance]) => {
    if (formattedOut.hasOwnProperty(address)) {
      formattedOut[address] += parseFloat(
        formatUnits(balance, options.decimals)
      );
    } else {
      formattedOut[address] = parseFloat(
        formatUnits(balance, options.decimals)
      );
    }
  });
  return Object.fromEntries(Object.entries(formattedOut));
}
