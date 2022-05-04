import { multicall } from '../../utils';
import { getProvider } from '../../utils';

export const author = 'clement-ux';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function locked(address arg0) external view returns (int128,uint256)'
];

const F = 4; // veSDT vote multiplicator

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // *** Query *** //

  // Ethereum Side
  const SDT_Query_ETH = addresses.map((address: any) => [
    options.SDT_ETHEREUM,
    'balanceOf',
    [address]
  ]);

  const SDT_Locked_Query_ETH = addresses.map((address: any) => [
    options.veSDT_ETHEREUM,
    'locked',
    [address]
  ]);
  const veSDT_Query_ETH = addresses.map((address: any) => [
    options.veSDT_ETHEREUM,
    'balanceOf',
    [address]
  ]);

  const SDT_RARI_Query_ETH = addresses.map((address: any) => [
    options.SDT_RARI_ETHEREUM,
    'balanceOf',
    [address]
  ]);
  const xSDT_RARI_Query_ETH = addresses.map((address: any) => [
    options.xSDT_RARI_ETHEREUM,
    'balanceOf',
    [address]
  ]);
  // Polygon Side
  const SDT_Query_POLYGON = addresses.map((address: any) => [
    options.SDT_POLYGON,
    'balanceOf',
    [address]
  ]);

  // *** Response *** //
  const responseETH = await multicall(
    options.network_ETHEREUM,
    getProvider(options.network_ETHEREUM),
    abi,
    [
      ...SDT_Query_ETH,
      ...SDT_Locked_Query_ETH,
      ...SDT_RARI_Query_ETH,
      ...xSDT_RARI_Query_ETH,
      ...veSDT_Query_ETH
    ],
    {
      blockTag
    }
  );
  const responsePOLYGON = await multicall(
    options.network_POLYGON,
    getProvider(options.network_POLYGON),
    abi,
    [...SDT_Query_POLYGON],
    {
      blockTag
    }
  );

  const responseCleanETH = responseETH.slice(0, responseETH.length);
  const responseCleanPOLYGON = responsePOLYGON.slice(0, responsePOLYGON.length);
  const chunksETH = chunk(responseCleanETH, addresses.length);
  const chunksPOLY = chunk(responseCleanPOLYGON, addresses.length);

  const SDT_ETH = chunksETH[0];
  const SDTLocked_ETH = chunksETH[1];
  const fSDT = chunksETH[2];
  const fxSDT = chunksETH[3];
  const veSDT = chunksETH[4];
  const SDT_POLY = chunksPOLY[0];

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const SDT_ETHi = SDT_ETH[i][0];
        const SDTLocked_ETHi = SDTLocked_ETH[i][0];
        const veSDTi = veSDT[i][0];
        const fSDTi = fSDT[i][0];
        const fxSDTi = fxSDT[i][0];
        const SDT_POLYi = SDT_POLY[i][0];

        // Print statements
        //console.log(`==================${addresses[i]}==================\n`);
        //console.log(`${SDT_ETHi / 10 ** 18} SDT_ETH`);
        //console.log(`${SDTLocked_ETHi / 10 ** 18} SDTLocked_ETH`);
        //console.log(`${veSDTi / 10 ** 18} veSDT`);
        //console.log(`${fSDTi / 10 ** 18} fSDT`);
        //console.log(`${fxSDTi / 10 ** 18} fxSDT`);
        //console.log(`${SDT_POLYi / 10 ** 18} SDT_POLY`);

        return [
          addresses[i],
          SDT_ETHi.add(SDTLocked_ETHi)
            .add(veSDTi.mul(F))
            .add(fSDTi)
            .add(fxSDTi)
            .add(SDT_POLYi) /
            10 ** 18
        ];
      })
  );
}
