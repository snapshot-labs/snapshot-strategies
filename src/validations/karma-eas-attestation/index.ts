import Validation from '../validation';
import fetch from 'cross-fetch';

interface Attestation {
  attester: string;
  data: string;
  recipient: string;
  revoked: boolean;
}
interface AttestationSchema {
  schema: {
    attestations: Attestation[];
  };
}
interface SubgraphResponse {
  data: AttestationSchema;
}

const EASNetworks = {
  1: 'https://easscan.org/graphql',
  10: 'https://optimism.easscan.org/graphql',
  42161: 'https://arbitrum.easscan.org/graphql',
  11155111: 'https://sepolia.easscan.org/graphql'
};

const easScanQuery = `
query Attestations($schemaId: String!) {
  schema(where: {id: $schemaId}) {
    attestations {
      attester
      data
      recipient
      revoked
    }
  }
}
`;

/**
 * Query EAS subgraph to determine if user is attested
 * @param schemaId Schema UID
 * @param address Targer user address
 * @param network Network ID (1 = mainnet, 11155111 = sepolia)
 * @returns
 */
async function isAttested(schemaId: string, address: string, network = 1) {
  const easUrl = EASNetworks[network];
  if (!easUrl) throw new Error(`EAS network ${network} not supported`);

  const response: SubgraphResponse = await fetch(easUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: easScanQuery,
      variables: { schemaId }
    })
  }).then((res) => res.json());
  const index = response.data.schema.attestations.findIndex(
    (a) => a.recipient.toLowerCase() === address.toLowerCase() && !a.revoked
  );

  return index >= 0;
}

export default class extends Validation {
  public id = 'karma-eas-attestation';
  public github = 'karmahq';
  public version = '0.1.0';
  public title = 'Karma EAS Attestation';
  public description =
    'Use EAS attest.sh to determine if user can create a proposal.';
  public proposalValidationOnly = true;
  async validate(): Promise<boolean> {
    const schemaId = this.params.schemaId;
    if (!schemaId) throw new Error(`Attestation schema not provided`);

    if (!Number.isSafeInteger(+this.network))
      throw new Error(`Network ID ${this.network} not supported`);

    return isAttested(schemaId, this.author, +this.network);
  }
}
