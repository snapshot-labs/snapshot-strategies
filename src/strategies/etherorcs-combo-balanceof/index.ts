import fetch from 'cross-fetch';

export const author = 'tempest-sol';
export const version = '0.1.1';

type OrcType = {
  _id: number;
  owner: string;
};

export async function strategy(
  space,
  network,
  provider,
  addresses
): Promise<Record<string, number>> {
  const count: Record<string, number> = {};
  const res = await fetch('https://open-api.etherorcs.com/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query(
        $orcsFilter: FilterFindManyorcsInput
        ) {
        orcs(filter: $orcsFilter) {
          _id
          owner
        }
        }`,
      variables: {
        orcsFilter: {
          OR: addresses.map((address) => ({ owner: address.toLowerCase() }))
        }
      }
    })
  });
  const response = await res.json();
  if (response && response.data) {
    const orcs: OrcType[] = response.data.orcs;
    addresses.forEach((address) => {
      count[address] = orcs.filter(
        (orc) => orc.owner.toLowerCase() === address.toLowerCase()
      ).length;
    });
  }
  return count || {};
}
