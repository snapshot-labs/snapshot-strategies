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

  for (const address of addresses) {
    try {
      const stakingInfo = await contract.getStakingInfo(address, {
        blockTag
      });
      const orderBalance = stakingInfo[0];
      const esOrderBalance = stakingInfo[1];
      const totalScore =
        parseFloat(formatUnits(orderBalance, ORDERLY_DECIMALS)) +
        parseFloat(formatUnits(esOrderBalance, ORDERLY_DECIMALS));
      results[address] = totalScore;
    } catch (error) {
      console.error(`Error fetching staking info for ${address}:`, error);
      results[address] = 0;
    }
  }

  return results;
}
