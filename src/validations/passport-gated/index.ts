import fetch from 'cross-fetch';
import Validation from '../validation';
import snapshot from '@snapshot-labs/snapshot.js';

// Create one from https://scorer.gitcoin.co/#/dashboard/api-keys
const API_KEY = process.env.PASSPORT_API_KEY || '';

const headers = API_KEY
  ? {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  : undefined;

const GET_PASSPORT_STAMPS_URI = `https://api.scorer.gitcoin.co/registry/stamps/`;

function hasValidIssuanceAndExpiration(credential, proposalTs) {
  const issuanceDate = Number(
    new Date(credential.issuanceDate).getTime() / 1000
  ).toFixed(0);
  const expirationDate = Number(
    new Date(credential.expirationDate).getTime() / 1000
  ).toFixed(0);
  if (issuanceDate <= proposalTs && expirationDate >= proposalTs) {
    return true;
  }
  return false;
}

export default class extends Validation {
  public id = 'passport-gated';
  public github = 'snapshot-labs';
  public version = '0.1.0';
  public title = 'Gitcoin Passport Gated';
  public description =
    'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

  async validate(currentAddress = this.author): Promise<boolean> {
    const requiredStamps = this.params.stamps || [];
    const operator = this.params.operator;
    if (!operator) throw new Error('Operator is required');

    const stampsResponse = await fetch(
      GET_PASSPORT_STAMPS_URI + currentAddress,
      { headers }
    );

    const stampsData = await stampsResponse.json();

    if (!stampsData?.items) {
      console.log('[passport] Unknown error', stampsData);
      throw new Error('Unknown error');
    }
    if (stampsData.items.length === 0) return false;

    const provider = snapshot.utils.getProvider(this.network);
    const proposalTs = (await provider.getBlock(this.snapshot)).timestamp;
    // check expiration for all stamps
    const validStamps = stampsData.items
      .filter((stamp) =>
        hasValidIssuanceAndExpiration(stamp.credential, proposalTs)
      )
      .map((stamp) => stamp.credential.credentialSubject.provider);

    if (operator === 'AND') {
      return requiredStamps.every((stamp) => validStamps.includes(stamp));
    } else if (operator === 'OR') {
      return requiredStamps.some((stamp) => validStamps.includes(stamp));
    }
    return false;
  }
}
