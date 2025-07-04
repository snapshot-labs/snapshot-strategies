import { formatUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const author = 'Tarnadas';
export const version = '0.1.0';

const ORDERLY_RPC_URL = 'https://rpc.orderly.network';
const ORDERLY_OMNIVAULT_ADDRESS = '0x7819704B69a38fD63Cc768134b8410dc08B987D0';
const ORDERLY_DECIMALS = 18;

const abi = [
  'function getStakingInfo(address _user) external view returns (uint256 orderBalance, uint256 esOrderBalance)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot: number | 'latest'
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const orderlyProvider = new StaticJsonRpcProvider(ORDERLY_RPC_URL);

  const contract = new Contract(
    ORDERLY_OMNIVAULT_ADDRESS,
    abi,
    orderlyProvider
  );

  const results: Record<string, number> = {};
  const batchSize = 10;

  const chunkArray = (array: string[], size: number): string[][] => {
    const chunks: string[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const addressBatches = chunkArray(addresses, batchSize);

  for (const batch of addressBatches) {
    const batchPromises = batch.map(async (address) => {
      try {
        const stakingInfo = await contract.getStakingInfo(address, {
          blockTag
        });
        const orderBalance = stakingInfo[0];
        const esOrderBalance = stakingInfo[1];
        const totalScore =
          parseFloat(formatUnits(orderBalance, ORDERLY_DECIMALS)) +
          parseFloat(formatUnits(esOrderBalance, ORDERLY_DECIMALS));
        return { address, score: totalScore };
      } catch (error) {
        console.error(`Error fetching staking info for ${address}:`, error);
        return { address, score: 0 };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach(({ address, score }) => {
      results[address] = score;
    });
  }

  return results;
}
