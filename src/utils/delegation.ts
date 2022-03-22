import { getAddress } from '@ethersproject/address';
import { subgraphRequest, SNAPSHOT_SUBGRAPH_URL } from '../utils';

export async function getDelegations(space, network, addresses, snapshot) {
  const addressesLc = addresses.map((addresses) => addresses.toLowerCase());
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  const PAGE_SIZE = 1000;
  let result = [];
  let page = 0;
  const params = {
    delegations: {
      __args: {
        where: {
          // delegate_in: addressesLc,
          // delegator_not_in: addressesLc,
          space_in: spaceIn
        },
        first: PAGE_SIZE,
        skip: 0,
				orderBy: "timestamp",
				orderDirection: "asc"
      },
      delegator: true,
      space: true,
      delegate: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.delegations.__args.block = { number: snapshot };
  }
  while (true && page < 6) {
    params.delegations.__args.skip = page * PAGE_SIZE;

    const pageResult = await subgraphRequest(
      SNAPSHOT_SUBGRAPH_URL[network],
      params
    );
    const pageDelegations = pageResult.delegations || [];
    result = result.concat(pageDelegations);
    page++;
    if (pageDelegations.length < PAGE_SIZE) break;
  }
	if(page == 6) {
		params.delegations.__args.orderDirection = "desc";
		page = 0;
		while (true && page < 6) {
	    params.delegations.__args.skip = page * PAGE_SIZE;

	    const pageResult = await subgraphRequest(
	      SNAPSHOT_SUBGRAPH_URL[network],
	      params
	    );
	    const pageDelegations = pageResult.delegations || [];
			for(i in pageDelegations) {
				var found = result.find(function(entry, index) {
					if(entry.delegator == pageDelegations[i].delegator)
						return true;
				});
				if(found) {
					pageDelegations.length = i;
					break;
				}
			}
	    result = result.concat(pageDelegations);
	    page++;
	    if (pageDelegations.length < PAGE_SIZE) break;
	  }
	}

  const delegations = result.filter(
    (delegation: any) =>
      addressesLc.includes(delegation.delegate) &&
      !addressesLc.includes(delegation.delegator)
  );
  if (!delegations) return {};

  const delegationsReverse = {};
  delegations.forEach(
    (delegation: any) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  delegations
    .filter((delegation: any) => delegation.space !== '')
    .forEach(
      (delegation: any) =>
        (delegationsReverse[delegation.delegator] = delegation.delegate)
    );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      Object.entries(delegationsReverse)
        .filter(([, delegate]) => address.toLowerCase() === delegate)
        .map(([delegator]) => getAddress(delegator))
    ])
  );
}
