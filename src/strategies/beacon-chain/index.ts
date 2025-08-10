import { formatUnits } from '@ethersproject/units';
import { customFetch } from '../../utils';

export const author = 'gnosis';
export const version = '0.0.1';

interface BeaconChainValidator {
  index: string;
  balance: string;
  status: string;
  validator: {
    pubkey: string;
    withdrawal_credentials: string;
    effective_balance: string;
    slashed: boolean;
    activation_eligibility_epoch: string;
    activation_epoch: string;
    exit_epoch: string;
    withdrawable_epoch: string;
  };
}

interface BeaconChainResponse {
  execution_optimistic: boolean;
  finalized: boolean;
  data: BeaconChainValidator[];
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const {
    clEndpoint = 'https://rpc-gbc.gnosischain.com',
    clMultiplier = '32',
    decimals = 9
  } = options;

  const endpoint = `${clEndpoint}/eth/v1/beacon/states/head/validators?status=active`;

  try {
    // Fetch all active validators from Beacon Chain
    const response = await customFetch(endpoint, {}, 30000);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const json: BeaconChainResponse = await response.json();
    const validators = json.data;
    const multiplier = BigInt(clMultiplier);

    // Create a map to store voting power for each address
    const votingPower: Record<string, bigint> = {};

    // Process each address
    for (const address of addresses) {
      // Normalize the address: remove 0x prefix and lowercase
      const addrHex = address.toLowerCase().replace(/^0x/, '');
      
      // Filter validators by withdrawal credentials
      const userValidators = validators.filter((validator) => {
        const creds = validator.validator.withdrawal_credentials;
        // Check for ETH1 (0x01) or ETH2 (0x02) withdrawal credentials that end with the address
        return (
          (creds.startsWith('0x01') || creds.startsWith('0x02')) && 
          creds.endsWith(addrHex)
        );
      });
      
      // Calculate total balance for this address
      let totalBalance = BigInt(0);
      for (const validator of userValidators) {
        const balance = BigInt(validator.balance);
        
        // Apply multiplier (e.g., to scale down from gwei to GNO)
        totalBalance += balance / multiplier;
      }

      if (totalBalance > 0) {
        votingPower[address] = totalBalance;
      }
    }

    // Convert to final format with proper decimals
    return Object.fromEntries(
      Object.entries(votingPower).map(([address, balance]) => [
        address,
        parseFloat(formatUnits(balance.toString(), decimals))
      ])
    );

  } catch (error) {
    console.error('Error fetching beacon chain data:', error);
    // Return empty scores on error rather than throwing
    return Object.fromEntries(addresses.map(address => [address, 0]));
  }
}
