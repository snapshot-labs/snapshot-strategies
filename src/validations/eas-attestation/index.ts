import Validation from '../validation';
import fetch from 'cross-fetch';

export const author = 'KarmaHQ';
export const version = '0.1.1';

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
  11155111: 'https://sepolia.easscan.org/graphql',
  1: 'https://easscan.org/graphql'
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
  public id = 'eas-attestation';
  public github = 'karmahq';
  public version = '0.1.0';
  public title = 'EAS Attestation';
  public description =
    'Use EAS attest.sh to determine if user can create a proposal.';

  async validate(): Promise<boolean> {
    if (this.params.strategies?.length > 8)
      throw new Error(`Max number of strategies exceeded`);

    const schemaId = this.params.schemaId;
    if (!schemaId) throw new Error(`Attestation schema not provided`);

    if (!Number.isSafeInteger(+this.network))
      throw new Error(`Network ID ${this.network} not supported`);

    return isAttested(schemaId, this.author, +this.network);
  }
}
