import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'bonustrack';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

const DEFAULT_SPREADSHEET_ID =
  '2PACX-1vSiB0k576wpy0jEb5y2YFDTZEoCpfF-FM9O-PdUyFFTBUaqjyArc-nbc6h0Ob6ckQxv3W0lK6QK_x0G';
const DEFAULT_GID = '0';

function csvToJson(csv) {
  const lines = csv.split('\n');
  const keys = lines[0].split(',').map((key) => key.trim());
  return lines.slice(1).map((line) =>
    line.split(',').reduce((acc, cur, i) => {
      const toAdd = {};
      toAdd[keys[i]] = cur.trim();
      return { ...acc, ...toAdd };
    }, {})
  );
}

export async function strategy(
  space, // expects a space value even though never used
  network, // expects a network value even though never used
  provider,
  addresses,
  options,
  snapshot
) {
  const block = await provider.getBlock(snapshot);
  const ts = block.timestamp;
  const SPREADSHEET_ID = options.sheetId ?? DEFAULT_SPREADSHEET_ID;
  const GID = options.gid ?? DEFAULT_GID;
  const url = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${GID}&single=true&output=csv`;
  const res = await fetch(url);
  const text = await res.text();
  const csv = csvToJson(text) || [];
  const scores = Object.fromEntries(
    csv
      .map((item) => ({
        ...item,
        delegate: getAddress(item.delegate),
        amount: item.amount,
        ts: parseInt(item.timestamp || '0')
      }))
      .filter((item) => item.ts <= ts && !addresses.includes(item.delegate))
      .sort((a, b) => a.ts - b.ts)
      .map((item) => [item.delegate, item.amount / 10**options.decimals])
  );

  return scores;
}
