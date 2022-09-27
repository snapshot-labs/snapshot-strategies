import { formatUnits } from '@ethersproject/units';
import {getProvider, getSnapshots, multicall} from '../../utils';

export const author = 'maxbrand99-eth';
export const version = '1.0.0';

const bananaContract = '0xe2311ae37502105b442bbef831e9b53c5d2e9b3b';

// addresses are blacklisted across all registries instead of just one, but that should be ok
const blacklistedAddresses = [
  '0xb14b87790643d2dab44b06692d37dd95b4b30e56', // WGK
  '0x9d59eba4deaee09466ba9d4073bf912bc72982b0', // NFT20 Gen
  '0x0f4676178b5c53ae0a655f1b19a96387e4b8b5f2', // NFT20 VX
  '0xcfa9a297a406a48d1137172c18de04c944b47ba9', // Banana Sushi
  '0x820f92c1b3ad8e962e6c6d9d7caf2a550aec46fb', // Banana Tip.cc
  '0x9ffad2ff3a59d8579e3b0edc6c8f2f591c94dfab', // Banana cyberkongz.eth
  '0xe058d87fc1185e38ab68893136834715b30961e1', // Banana Rewarder
  '0xe2311ae37502105b442bbef831e9b53c5d2e9b3b', // CyberKongZ: BANANA Token
  '0x7a08865A3E7c291f3b794210Bc51D559B49DFd15', // The Klaw - mainchain
  '0xe6f45376f64e1f568bd1404c155e5ffd2f80f7ad', // VX Polygon Bridge - mainchain
  '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf', // Banana Polygon Bridge - mainchain
  '0x0000000000000000000000000000000000000000', // VX Polygon -> mainchain Brige (Polygon)
  '0xD6a92755Ac5384867083Abd79aD007DE389b955e', // Cyberkong Gnosis (Polygon)
  '0x000000000000000000000000000000000000dead', // Matic Burn Address (Polygon)
  '0x70C575588B98C1F46B1382c706AdAf398A874e3E', // Kong Proxy (Polygon)
  '0xab8eee3493a55a7bd8126865fd662b7097928088', // Marketplace LP (Polygon)
];

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

export async function strategy(space, network, provider, addresses, options, snapshot) {
  const allAddresses = {};
  const promises: any = [];
  const blocks = await getSnapshots(network, snapshot, provider, options.chains.map((s) => s.network || network));
  const allCalls: any[] = [];
  options.chains.forEach((chain) => {
    const calls: any[] = [];
    Object.keys(chain.registries).forEach((registry) => {
      allAddresses[registry] = chain.registries[registry]
      addresses.forEach((address: any) => {
        calls.push([registry, 'balanceOf', [address]]);
        allCalls.push([registry, 'balanceOf', [address]]);
      });
    });
    const blockTag = typeof blocks[chain.network] === 'number' ? blocks[chain.network] : 'latest';
    promises.push(
      multicall(chain.network, getProvider(chain.network), abi, calls, {blockTag})
    );
  })

  const results = await Promise.all(promises);

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const nanaCall = [[bananaContract, 'totalSupply', []]];
  let nanaSupply = await multicall(network, provider, abi, nanaCall, {blockTag});


  const response: any[] = []
  results.forEach((result) => {
    result.forEach((value) => {
      response.push(value)
    })
  })

  response.forEach((value: any, i: number) => {
    const address = allCalls[i][2][0];
    if (allAddresses[allCalls[i][0]] == "BANANA" && blacklistedAddresses.find((add) => add === address)) {
      nanaSupply -= value;
    }
  });

  const merged = {};
  response.forEach((value: any, i: number) => {
    const address = allCalls[i][2][0];
    if (blacklistedAddresses.find((add) => add === address)) {
      return;
    }
    merged[address] = (merged[address] || 0) as number;
    if (allAddresses[allCalls[i][0]] == "OG")
      merged[address] += parseFloat(formatUnits((3 * value).toString(), 0));
    else if (allAddresses[allCalls[i][0]] == "VX")
      merged[address] += parseFloat(formatUnits(value.toString(), 0));
    else if (allAddresses[allCalls[i][0]] == "BANANA")
      merged[address] += parseFloat(formatUnits(Math.floor((15000 * value) / nanaSupply).toString(), 0));
  });

  return merged;
}
