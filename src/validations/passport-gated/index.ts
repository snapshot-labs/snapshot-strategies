import fetch from 'cross-fetch';
import snapshot from '@snapshot-labs/snapshot.js';

import STAMPS from './stampsMetadata.json';
import Validation from '../validation';

// Create one from https://scorer.gitcoin.co/#/dashboard/api-keys
const API_KEY = process.env.PASSPORT_API_KEY || '';
const SCORER_ID = process.env.PASSPORT_SCORER_ID || '';

const headers = API_KEY
  ? {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  : undefined;

// const GET_STAMPS_METADATA_URI = `https://api.scorer.gitcoin.co/registry/stamp-metadata`;
const GET_PASSPORT_STAMPS_URI = `https://api.scorer.gitcoin.co/registry/stamps/`;
const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${SCORER_ID}/`;
const POST_SUBMIT_PASSPORT_URI = `https://api.scorer.gitcoin.co/registry/submit-passport`;

const PASSPORT_SCORER_MAX_ATTEMPTS = 2;

const stampCredentials = STAMPS.map((stamp) => {
  return {
    id: stamp.id,
    name: stamp.name,
    description: stamp.description,
    credentials: stamp.groups
      .flatMap((group) => group.stamps)
      .map((credential) => credential.name)
  };
});

// Useful to get stamp metadata and update `stampsMetata.json`
// console.log('stampCredentials', JSON.stringify(stampCredentials.map((s) => ({"const": s.id, title: s.name}))));

function hasValidIssuanceAndExpiration(credential: any, proposalTs: string) {
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

function hasStampCredential(stampId: string, credentials: Array<string>) {
  const stamp = stampCredentials.find((stamp) => stamp.id === stampId);
  if (!stamp) {
    console.log('[passport] Stamp not supported', stampId);
    throw new Error('Stamp not supported');
  }
  return credentials.some((credential) =>
    stamp.credentials.includes(credential)
  );
}

async function validateStamps(
  currentAddress: string,
  operator: string,
  proposalTs: string,
  requiredStamps: Array<string> = []
): Promise<boolean> {
  if (requiredStamps.length === 0) return true;

  const stampsResponse = await fetch(GET_PASSPORT_STAMPS_URI + currentAddress, {
    headers
  });
  const stampsData = await stampsResponse.json();

  if (!stampsData?.items) {
    console.log('[passport] Stamps Unknown error', stampsData);
    throw new Error('Unknown error');
  }
  if (stampsData.items.length === 0) return false;

  // check expiration for all stamps
  const validStamps = stampsData.items
    .filter((stamp: any) =>
      hasValidIssuanceAndExpiration(stamp.credential, proposalTs)
    )
    .map((stamp: any) => stamp.credential.credentialSubject.provider);

  if (operator === 'AND') {
    return requiredStamps.every((stampId) =>
      hasStampCredential(stampId, validStamps)
    );
  } else if (operator === 'OR') {
    return requiredStamps.some((stampId) =>
      hasStampCredential(stampId, validStamps)
    );
  }
  return false;
}

function evalPassportScore(scoreData: any, minimumThreshold = 0): boolean {
  // scoreData.evidence?.type === 'ThresholdScoreCheck' -> Returned if using Boolean Unique Humanity Scorer (should not be used)
  if (scoreData.evidence?.type === 'ThresholdScoreCheck') {
    return (
      Number(scoreData.evidence.rawScore) > Number(scoreData.evidence.threshold)
    );
  }
  // scoreData.score -> Returned if using Unique Humanity Score
  return Number(scoreData.score) >= minimumThreshold;
}

async function validatePassportScore(
  currentAddress: string,
  scoreThreshold: number
): Promise<boolean> {
  // always hit the /submit-passport endpoint to get the latest passport score
  const submittedPassport = await fetch(POST_SUBMIT_PASSPORT_URI, {
    headers,
    method: 'POST',
    body: JSON.stringify({ address: currentAddress, scorer_id: SCORER_ID })
  });
  const submissionData =
    submittedPassport.ok && (await submittedPassport.json());

  if (!submittedPassport.ok) {
    const reason = !SCORER_ID
      ? 'SCORER_ID missing'
      : submittedPassport.statusText;
    console.log('[passport] Scorer error', reason);
    throw new Error(`Scorer error: ${reason}`);
  }

  // Scorer done calculating passport score during submission
  if (submittedPassport.ok && submissionData.status === 'DONE') {
    return evalPassportScore(submissionData, scoreThreshold);
  }

  // Try to fetch Passport Score if still processing (submittedPassport.status === 'PROCESSING')
  for (let i = 0; i < PASSPORT_SCORER_MAX_ATTEMPTS; i++) {
    const scoreResponse = await fetch(GET_PASSPORT_SCORE_URI + currentAddress, {
      headers
    });
    const scoreData = await scoreResponse.json();

    if (scoreResponse.ok && scoreData.status === 'DONE') {
      return evalPassportScore(scoreData, scoreThreshold);
    }
    console.log(
      `[passport] Waiting for scorer... (${i}/${PASSPORT_SCORER_MAX_ATTEMPTS})`
    );
    await snapshot.utils.sleep(3e3);
  }
  const reason =
    'Failed to fetch Passport Score. Reached PASSPORT_SCORER_MAX_ATTEMPTS';
  console.log('[passport] Scorer error', reason);
  throw new Error(`Scorer error: ${reason}`);
}

export default class extends Validation {
  public id = 'passport-gated';
  public github = 'snapshot-labs';
  public version = '1.0.0';
  public title = 'Gitcoin Passport Gated';
  public description =
    'Protect your proposals from spam and vote manipulation by requiring users to have a valid Gitcoin Passport.';

  async validate(currentAddress = this.author): Promise<boolean> {
    const requiredStamps = this.params.stamps || [];
    const operator = this.params.operator;
    const scoreThreshold = this.params.scoreThreshold;

    if (scoreThreshold === undefined)
      throw new Error('Score threshold is required');
    if (requiredStamps.length > 0 && (!operator || operator === 'NONE'))
      throw new Error('Operator is required when selecting required stamps');

    const provider = snapshot.utils.getProvider(this.network);
    const proposalTs = (await provider.getBlock(this.snapshot)).timestamp;
    const validStamps = await validateStamps(
      currentAddress,
      operator,
      proposalTs,
      requiredStamps
    );

    if (scoreThreshold === 0) {
      return validStamps;
    }

    const validScore = await validatePassportScore(
      currentAddress,
      scoreThreshold
    );

    return validStamps && validScore;
  }
}
