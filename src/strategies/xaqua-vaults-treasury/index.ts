import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'pepperati224';
export const version = '0.1.0';

function chunk(array, chunkSize) {
  const tempArray: any[] = [];
  for (let i = 0, len = array.length; i < len; i += chunkSize)
    tempArray.push(array.slice(i, i + chunkSize));
  return tempArray;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const abi = [
    'function balanceOf(address) view returns (uint256)',
    'function usersAllocation(address) view returns (uint256)'
  ];

  const callData: [any, string, [any]][] = [];

  // Prepare multicall input
  for (const address of addresses) {
    callData.push([options.vault1, 'balanceOf', [address]]);
    callData.push([options.vault2, 'balanceOf', [address]]);
    callData.push([options.treasury, 'usersAllocation', [address]]);
  }

  const chunks = chunk(callData, 2000); // to prevent overload
  const response: any[] = [];

  for (const chunkPart of chunks) {
    const temp = await multicall(network, provider, abi, chunkPart, { blockTag });
    response.push(...temp);
  }

  // Aggregate scores
  const scores: Record<string, number> = {};

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];

    const vault1Res = response[i * 3];
    const vault2Res = response[i * 3 + 1];
    const treasuryRes = response[i * 3 + 2];

    const vault1Bal = vault1Res?.[0] ?? 0;
    const vault2Bal = vault2Res?.[0] ?? 0;
    const treasuryBal = treasuryRes?.[0] ?? 0;

    const total = BigInt(vault1Bal) + BigInt(vault2Bal) + BigInt(treasuryBal);

    scores[address] = parseFloat(formatUnits(total.toString(), options.decimals));
  }

  return scores;
}