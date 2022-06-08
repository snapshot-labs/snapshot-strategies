import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'frosti-eth';
export const version = '0.1.0';

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
  '0xe2311ae37502105b442bbef831e9b53c5d2e9b3b' // CyberKongZ: BANANA Token
];

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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const calls: any[] = [];
  options.registries.forEach((registry) => {
    addresses.forEach((address: any) => {
      calls.push([registry, 'balanceOf', [address]]);
    });
  });

  const response = await multicall(network, provider, abi, calls, { blockTag });
  const nanaCall = [[bananaContract, 'totalSupply', []]];
  let nanaSupply = await multicall(network, provider, abi, nanaCall, {
    blockTag
  });

  response.forEach((value: any, i: number) => {
    const address = calls[i][2][0];
    if (
      Math.floor(i / addresses.length) == 2 &&
      blacklistedAddresses.find((add) => add === address)
    ) {
      nanaSupply -= value;
    }
  });

  const merged = {};
  response.map((value: any, i: number) => {
    const address = calls[i][2][0];
    if (blacklistedAddresses.find((add) => add === address)) {
      return;
    }
    merged[address] = (merged[address] || 0) as number;
    if (Math.floor(i / addresses.length) == 0)
      merged[address] += parseFloat(formatUnits((3 * value).toString(), 0));
    else if (Math.floor(i / addresses.length) == 1)
      merged[address] += parseFloat(formatUnits(value.toString(), 0));
    else if (Math.floor(i / addresses.length) == 2)
      merged[address] += parseFloat(
        formatUnits(Math.floor((15000 * value) / nanaSupply).toString(), 0)
      );
  });

  return merged;
}
