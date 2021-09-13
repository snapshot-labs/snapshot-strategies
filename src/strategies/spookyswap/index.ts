import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = 'ooGwei';
export const version = '0.1.0';

const FARM_ADDRESS = '0x2b2929E785374c651a81A63878Ab22742656DcDd';
const LP_TOKEN_ADDRESS = '0xEc7178F4C41f346b2721907F5cF7628E388A7a58';
const BOO_TOKEN_ADDRESS = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE';
const XBOO_TOKEN_ADDRESS = '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598';
const XBOO_STAKING_ADDRESS = '0x2352b745561e7e6FCD03c093cE7220e3e126ace0';

const abi = [
  'function balanceOf(address) view returns (uint256 amount)',
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function totalSupply() view returns (uint256)',
  'function xBOOForBOO(uint256 _xBOOAmount) view returns (uint256 booAmount_)',
  'function poolLength() view returns (uint256)'
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
  const multi = new Multicaller(network, provider, abi, { blockTag });
  const precision = BigNumber.from(10).pow(18);

  const xbooPoolLength = await call(
    provider,
    abi,
    [XBOO_STAKING_ADDRESS, 'poolLength', []]
  );

  addresses.forEach((address: any) => {
    multi.call(`boo.${address}`, BOO_TOKEN_ADDRESS, 'balanceOf', [address]);
    multi.call(`xboo.${address}`, XBOO_TOKEN_ADDRESS, 'balanceOf', [address]);
    multi.call(`lpInFarm.${address}`, FARM_ADDRESS, 'userInfo', ['0', address]);
    multi.call(`lp.${address}`, LP_TOKEN_ADDRESS, 'balanceOf', [address]);
    options.vaultTokens.forEach((token: any) => {
      multi.call(
        `vaultTokens.${address}.${token.address}`,
        token.address,
        'balanceOf',
        [address]
      );
    });
    for (let i = 0; i < xbooPoolLength; i++) {
      multi.call(`xboo.staking.${address}.${i}`, XBOO_STAKING_ADDRESS, 'userInfo', [i, address]);
    }
  });
  multi.call(`lp.totalSupply`, LP_TOKEN_ADDRESS, 'totalSupply', []);
  multi.call(`lp.boo`, BOO_TOKEN_ADDRESS, 'balanceOf', [LP_TOKEN_ADDRESS]);
  multi.call(`xboo.booValue`, XBOO_TOKEN_ADDRESS, 'xBOOForBOO', [precision.mul(1)]);

  const result = await multi.execute();
  const xbooToBoo = parseFloat(formatUnits(result.xboo.booValue, 18))

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      // BOO in wallet 
      parseFloat(
        formatUnits(
          result.boo[address]
            .mul(options.boo.numerator)
            .div(options.boo.denominator),
          18
        )
      ) +
        // xBOO in wallet
        xbooToBoo * parseFloat(
          formatUnits(
            result.xboo[address]
              .mul(options.boo.numerator)
              .div(options.boo.denominator),
            18
          )
        ) +
        // BOO-FTM in LP in farm
        parseFloat(
          formatUnits(
            result.lpInFarm[address][0]
              .mul(result.lp.boo)
              .div(result.lp.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        // BOO-FTM in LP in wallet
        parseFloat(
          formatUnits(
            result.lp[address]
              .mul(result.lp.boo)
              .div(result.lp.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        // BOO-FTM and BOO represented in vault tokens
        options.vaultTokens.reduce(
          (prev: number, token: any, idx: number) =>
            prev +
            parseFloat(
              formatUnits(
                result.vaultTokens[address][token.address]
                  .mul(options.vaultTokens[idx].numerator)
                  .div(options.vaultTokens[idx].denominator),
                options.vaultTokens[idx].decimal
              )
            ),
          0
        ) +
        // xBOO staked
        result.xboo.staking[address].reduce(
          (prev: number, cur: any) =>
            prev +
            xbooToBoo * parseFloat(
              formatUnits(
                cur[0]
                  .mul(options.boo.numerator)
                  .div(options.boo.denominator),
                18
              )
            ),
          0
        )
    ])
  );
}
