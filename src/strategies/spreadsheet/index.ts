import fetch from 'cross-fetch';

export const author = 'bonustrack';
export const version = '0.1.0';
export const dependOnOtherAddress = false;

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
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const block = await provider.getBlock(snapshot);
  const ts = block.timestamp;

  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/e/${options.sheetId}/pub?gid=${
      options.gid || '0'
    }&single=true&output=csv`
  );
  const text = await res.text();
  const csv = (csvToJson(text) || []).map((item) => ({
    address: item.address,
    vp: parseFloat(item['voting power'] || '0'),
    ts: parseInt(item.timestamp || '0')
  }));

  return Object.fromEntries(
    addresses.map((address) => {
      const items = csv
        .filter(
          (item) =>
            item.address.toLowerCase() === address.toLowerCase() &&
            item.ts <= ts
        )
        .sort((a, b) => a.ts - b.ts);
      const vp = (items.pop() || {}).vp || 0;
      return [address, vp];
    })
  );
}
