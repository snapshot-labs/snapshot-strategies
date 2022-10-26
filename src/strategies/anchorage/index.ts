import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';
import { getScoresDirect } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

const SPREADSHEET_ID =
  '2PACX-1vQsn8e6KQOwqfHoA4rWDke63jTwfcshHxcZwOzVharOoAARWy6aX0TvN-uzzgtmAn3F5vDbuDKnk5Jw';
const GID = '506976679';

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

  const url = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${GID}&single=true&output=csv`;
  const res = await fetch(url);
  const text = await res.text();
  const csv = csvToJson(text) || [];

  const delegations = Object.fromEntries(
    csv
      .map((item) => ({
        ...item,
        delegator: getAddress(item.delegator),
        delegate: getAddress(item.delegate),
        ts: parseInt(item.timestamp || '0')
      }))
      .filter(
        (item) =>
          item.ts <= ts &&
          item.space === space &&
          !addresses.includes(item.delegator)
      )
      .sort((a, b) => a.ts - b.ts)
      .map((item) => [item.delegator, item.delegate])
  );

  const delegatorScores = await getScoresDirect(
    space,
    options.strategies,
    network,
    provider,
    Object.keys(delegations),
    snapshot
  );

  const scores = {};
  delegatorScores.forEach((score) => {
    Object.entries(score).forEach(([address, vp]) => {
      if (delegations[address] && addresses.includes(delegations[address])) {
        if (!scores[delegations[address]]) scores[delegations[address]] = 0;
        scores[delegations[address]] += vp;
      }
    });
  });

  return scores;
}
