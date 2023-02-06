import { getAddress } from '@ethersproject/address';
import { JsonRpcProvider } from '@ethersproject/providers';
import { blake2bHex } from './blake2b';

export const author = 'crystalin';
export const version = '0.1.0';

export function readLittleEndianBigInt(hex: string) {
  return BigInt(`0x${hex.match(/../g)?.reverse().join('')}`);
}

export async function strategy(
  space: string,
  network: string,
  provider: JsonRpcProvider,
  addresses: string[]
) {
  // Pre-encoded key prefix for "system.account" storage
  const accountPrefix = `0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9`;

  return Object.fromEntries(
    await Promise.all(
      addresses.map(async (address) => {
        // Computes "system.account" key for given address
        const key = `${accountPrefix}${await blake2bHex(
          Buffer.from(address.substring(2), 'hex'),
          16
        )}${address.substring(2)}`;

        // Retrieves storage data for the "system.account" key
        const result: string = await provider.send('state_getStorage', [key]);

        // account data structure (little endian):
        // {
        //   nonce: 8 bits
        //   consumers: 8 bits
        //   providers: 8 bits
        //   sufficients: 8 bits
        //   data: {
        //     free: 32 bits
        //     reserved: 32 bits
        //     miscFrozen: 32 bits
        //     feeFrozen: 32 bits
        //   }
        // }
        const free = readLittleEndianBigInt(
          result.substring(2 + 8 + 8 + 8 + 8, 2 + 8 + 8 + 8 + 8 + 32)
        );

        // Converts the bigint into number.
        // Result won't be precise, but should be lower than real value.
        return [getAddress(address), Number(free)];
      })
    )
  );
}
