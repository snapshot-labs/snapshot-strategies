import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as erc721BalanceOfStrategy } from '../erc721';
const networks = require('@snapshot-labs/snapshot.js/src/networks.json');
const { JsonRpcProvider } = require('@ethersproject/providers');

export const author = 'DesiredDesire';
export const version = '0.0.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const erc20score: Record<string, number> = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const options_erc721 = {
    address: options.address_erc721,
    symbol: options.symbol_erc721
  };

  const network_erc721 =
    typeof options.network_erc721 === 'string'
      ? options.network_erc721
      : network;
  const snapshot_erc721 =
    typeof options.snapshot_erc721 === 'number'
      ? options.snapshot_erc721
      : snapshot;
  const provider_erc721 = new JsonRpcProvider(networks[network_erc721].rpc[3]);

  const erc721score: Record<string, number> = await erc721BalanceOfStrategy(
    space,
    network_erc721,
    provider_erc721,
    addresses,
    options_erc721,
    snapshot_erc721
  );

  return Object.fromEntries(
    Object.entries(erc20score).map((address: any) => [
      address[0],
      erc721score[address[0]] > 0 ? address[1] : 0
    ])
  );
}
