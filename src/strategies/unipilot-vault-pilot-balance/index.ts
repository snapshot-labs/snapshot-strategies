import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

import { subgraphRequest, call, multicall } from '../../utils';

export const author = 'daniyalmanzoor';
export const version = '0.1.0';

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
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

  const params = {
    vaults: {
      __args: {
        where: {
          id: options.vaultAddress.toLowerCase()
        }
      },
      totalLockedToken0: true
    }
  };

  const { vaults } = await subgraphRequest(options.unipilotSubgraphURI, params);

  const _totalLP: BigNumber = await call(
    provider,
    options.unipilotVaultMethodABI,
    [options.vaultAddress, 'totalSupply']
  );

  /**
   * Unipilot pilot vault balance
   */
  const userVaultLP = await multicall(
    network,
    provider,
    options.unipilotVaultMethodABI,
    addresses.map((_address) => [
      options.vaultAddress,
      'balanceOf',
      [_address]
    ]),
    { blockTag }
  );

  /**
   * Unipilot Farming pilot balance
   */
  const userFarmingVaultLP = await multicall(
    network,
    provider,
    options.unipilotFarmingMethodABI,
    addresses.map((_address) => [
      options.unipilotFarming,
      'userInfo',
      [options.vaultAddress, _address]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    addresses.map((_address, i) => {
      const _userShare = bn(userVaultLP[i])
        .add(bn(userFarmingVaultLP[i].lpLiquidity))
        .mul(bn(10 ** 18))
        .div(_totalLP);

      const _userBalance = formatUnits(
        bn(_userShare).mul(bn(vaults[0].totalLockedToken0)).div(bn(10).pow(18)),
        options.decimals
      );

      return [_address, parseFloat(_userBalance)];
    })
  );
}
