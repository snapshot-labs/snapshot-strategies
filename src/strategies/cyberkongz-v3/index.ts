import { formatUnits } from '@ethersproject/units';
import { getProvider, getSnapshots, multicall } from '../../utils';

export const author = 'maxbrand99';
export const version = '1.0.0';

const bananaContract = '0xe2311ae37502105b442bbef831e9b53c5d2e9b3b';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const allAddresses = {};
  const promises: any = [];
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    options.chains.map((s) => s.network || network)
  );
  const allCalls: any[] = [];
  const chainCalls = { 1: [], 137: [] };
  options.chains.forEach((chain) => {
    if (chain.network == 1 || chain.network == 137) {
      Object.keys(chain.registries).forEach((registry) => {
        allAddresses[registry] = chain.registries[registry];
        addresses.forEach((address: any) => {
          chainCalls[chain.network].push([registry, 'balanceOf', [address]]);
          allCalls.push([registry, 'balanceOf', [address]]);
        });
      });
    }
  });

  Object.keys(chainCalls).forEach((chainID) => {
    const blockTag =
      typeof blocks[chainID] === 'number' ? blocks[chainID] : 'latest';
    promises.push(
      multicall(chainID, getProvider(chainID), abi, chainCalls[chainID], {
        blockTag
      })
    );
  });

  const results = await Promise.all(promises);

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const nanaCall = [[bananaContract, 'totalSupply', []]];
  let nanaSupply = await multicall(network, provider, abi, nanaCall, {
    blockTag
  });

  const response: any[] = [];
  results.forEach((result) => {
    result.forEach((value) => {
      response.push(value);
    });
  });

  response.forEach((value: any, i: number) => {
    const address = allCalls[i][2][0];
    if (
      allAddresses[allCalls[i][0]] == 'BANANA' &&
      options.skipList.find((add) => add === address)
    ) {
      nanaSupply -= value;
    }
  });

  const merged = {};
  response.forEach((value: any, i: number) => {
    const address = allCalls[i][2][0];
    if (options.skipList.find((add) => add === address)) {
      return;
    }
    merged[address] = (merged[address] || 0) as number;
    if (allAddresses[allCalls[i][0]] == 'OG')
      merged[address] += parseFloat(formatUnits((3 * value).toString(), 0));
    else if (allAddresses[allCalls[i][0]] == 'VX')
      merged[address] += parseFloat(formatUnits(value.toString(), 0));
    else if (allAddresses[allCalls[i][0]] == 'BANANA')
      merged[address] += parseFloat(
        formatUnits(Math.floor((15000 * value) / nanaSupply).toString(), 0)
      );
  });

  return merged;
}
