
import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'jscrui';
export const version = '0.1.1';

const abi = ['function shares(address account) view returns (uint256, uint256)'];

/**
 * This strategy is designed to calculate voting power based on 
 * the Staked ERC20 tokens in a given contract.
 */
export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
) {
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

    const response = await multicall(
        network,
        provider,
        abi,
        addresses.map((address: any) => [
            options.address,
            'shares',
            [address]
        ]),
        { blockTag }
    );
    
    return Object.fromEntries(
        response.map((value, i) => {                        
            // Format the voting power using the token decimals
            const votingPower = parseFloat(formatUnits(value[0], options.decimals)); // Convert using formatUnits
            //console.log(`${addresses[i]}: ${votingPower} (${symbol})`);
            return [addresses[i], votingPower];
        })
    );
}