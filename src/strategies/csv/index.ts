import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';

export const author = 'bonustrack';
export const version = '0.1.0';

interface Items {
  [address: string]: string;
}

async function parseCSV(
  url: string,
  lineSeparator = '\n',
  fieldSeparator = ','
): Promise<Items> {
  if (url.startsWith('ipfs://')) {
    url = url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  }

  const response = await fetch(url);
  const text = await response.text();

  const lines = text.split(lineSeparator);
  const items: Items = {};

  for (let i = 0; i < lines.length; i++) {
    const [address, value] = lines[i].split(fieldSeparator);

    if (address && value) {
      items[getAddress(address.trim())] = value.trim();
    }
  }

  return items;
}

export async function strategy(
  _space,
  _network,
  _provider,
  addresses,
  options
): Promise<Record<string, number>> {
  const result = await parseCSV(
    options.csv,
    options.lineSeparator,
    options.fieldSeparator
  );

  return Object.fromEntries(
    addresses
      .map((address) => {
        const checksum = getAddress(address);

        return [
          checksum,
          parseFloat(formatUnits(result[checksum] || 0, options.decimals))
        ];
      })
      .filter((address) => address[1] > 0)
  );
}
