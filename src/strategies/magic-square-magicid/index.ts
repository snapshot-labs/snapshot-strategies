import fetch from 'cross-fetch';
import { URLSearchParams } from "url";
import {getAddress} from "@ethersproject/address";

export const author = 'magic-square';
export const version = '1.0.0';
const magicIdAPI = "http://main-snap-strat.magic.store/check";

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const params = new URLSearchParams({
    space,
    addresses
  });
  const res = await fetch(`${magicIdAPI}?${params.toString()}`);
  const data = await res.json();

  return Object.fromEntries(
    addresses.map(addr => [getAddress(addr), data.hasOwnProperty(addr) ? Number(data[addr]) : 0])
  );
}
