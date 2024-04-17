import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, multicall, subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'payvint';
export const version = '2.0.0';

const abi = [
  'function getAndUpdateDelegatedAmount(address wallet) external returns (uint)',
  'function getEscrowAddress(address beneficiary) external view returns (address)'
];

const GRAPH_API_URL =
  'https://api.thegraph.com/subgraphs/name/ministry-of-decentralization/skale-manager-subgraph';

function returnGraphParamsValidatorPower(
  snapshot: number | string,
  addresses: string[]
) {
  const output = {
    delegations: {
      __args: {
        where: {
          and: [
            {
              or: [{ state: 'DELEGATED' }]
            },
            {
              holder_: {
                id_not_in: addresses.map((address: string) =>
                  address.toLowerCase()
                )
              }
            },
            {
              validator_: {
                address_in: addresses.map((address: string) =>
                  address.toLowerCase()
                )
              }
            }
          ]
        },
        first: 1000
      },
      holder: {
        id: true
      },
      validator: {
        address: true
      },
      amount: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    output.delegations.__args.block = { number: snapshot };
  }
  return output;
}

function returnGraphParamsValidatorOnly(
  snapshot: number | string,
  addresses: string[]
) {
  const output = {
    validators: {
      __args: {
        where: {
          address_in: addresses.map((address: string) => address.toLowerCase())
        },
        first: 1000
      },
      address: true,
      currentDelegationAmount: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    output.validators.__args.block = { number: snapshot };
  }
  return output;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  const combinedAddresses = [...addresses];
  const votePower = {};

  if (!options.validatorOnly || options.validatorOnly === false) {
    addresses.forEach((address) => {
      multi.call(address, options.addressSKL, 'getAndUpdateDelegatedAmount', [
        address
      ]);
    });
    const resultAccounts: Record<string, BigNumberish> = await multi.execute();

    const escrowAddressCallsQuery = addresses.map((address: any) => [
      options.addressAllocator,
      'getEscrowAddress',
      [address]
    ]);

    const escrowAddressesFromAccount = await multicall(
      network,
      provider,
      abi,
      [...escrowAddressCallsQuery],
      {
        blockTag
      }
    );

    escrowAddressesFromAccount.forEach((obj: any) => {
      if (obj[0] !== '0x0000000000000000000000000000000000000000') {
        combinedAddresses.push(obj[0]);
      }
    });

    const addressToEscrow = new Map();
    addresses.forEach((address: any, index: number) => {
      addressToEscrow[address] = escrowAddressesFromAccount[index][0];
    });

    addresses.forEach((address: any) => {
      multi.call(address, options.addressSKL, 'getAndUpdateDelegatedAmount', [
        addressToEscrow[address]
      ]);
    });

    const resultEscrows: Record<string, BigNumberish> = await multi.execute();

    Object.keys(resultAccounts).forEach((address: string) => {
      votePower[address] = parseFloat(
        formatUnits(
          BigNumber.from(resultAccounts[address]).add(
            BigNumber.from(resultEscrows[address])
          )
        )
      );
    });
  }

  if (options.validatorPower !== false && !options.validatorOnly) {
    const results = await subgraphRequest(
      GRAPH_API_URL,
      returnGraphParamsValidatorPower(blockTag, combinedAddresses)
    );

    const validatorsVotePower = new Map<string, BigNumberish>();

    results.delegations.forEach((delegation: any) => {
      if (!validatorsVotePower[getAddress(delegation.validator.address)]) {
        validatorsVotePower[getAddress(delegation.validator.address)] =
          BigNumber.from(0);
      }
      validatorsVotePower[getAddress(delegation.validator.address)] =
        BigNumber.from(
          validatorsVotePower[getAddress(delegation.validator.address)]
        ).add(BigNumber.from(delegation.amount));
    });
    Object.keys(validatorsVotePower).forEach((address: string) => {
      if (!votePower[address]) votePower[address] = 0;
      votePower[address] += parseFloat(
        formatUnits(BigNumber.from(validatorsVotePower[address]))
      );
    });
  } else if (options.validatorOnly) {
    const results = await subgraphRequest(
      GRAPH_API_URL,
      returnGraphParamsValidatorOnly(blockTag, combinedAddresses)
    );

    const validatorsVotePower = new Map<string, BigNumberish>();

    results.validators.forEach((validator: any) => {
      if (!validatorsVotePower[getAddress(validator.address)]) {
        validatorsVotePower[getAddress(validator.address)] = BigNumber.from(0);
      }
      validatorsVotePower[getAddress(validator.address)] = BigNumber.from(
        validatorsVotePower[getAddress(validator.address)]
      ).add(BigNumber.from(validator.currentDelegationAmount));
    });
    Object.keys(validatorsVotePower).forEach((address: string) => {
      if (!votePower[address]) votePower[address] = 0;
      votePower[address] += parseFloat(
        formatUnits(BigNumber.from(validatorsVotePower[address]))
      );
    });
  }

  return votePower;
}
