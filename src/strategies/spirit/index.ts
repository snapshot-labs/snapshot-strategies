import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'chimpydev';
export const version = '0.1.0';

async function search_contract_cretion_block(contract_address, provider) {
  var highest_block = await provider.getBlockNumber();
  var lowest_block = 13691033;

  var contract_code = await provider.getCode(contract_address, highest_block);

  if (contract_code == '0x') {
    return -1;
  }

  while (lowest_block <= highest_block) {
    let search_block = Math.floor((lowest_block + highest_block) / 2);
    contract_code = await provider.getCode(contract_address, search_block);
    contract_code != '0x'?highest_block = search_block:lowest_block = search_block;
    if (highest_block == lowest_block + 1) {
      return highest_block;
    }
  }
}

async function search_contract_creator(contract_address, block, provider) {
  var block = await provider.getBlock(block);
  var transactions = block.transactions;
  if (block == -1) {
    return contract_address;
  }
  for (var y = 0; y < transactions.length; y++) {
    let receipt = await provider.getTransactionReceipt(transactions[y]);
    if (receipt.contractAddress == contract_address) {
      return receipt.from;
    }
  }

  return contract_address;
}

async function find_contract_creator(contract_address, provider) {
  var block = await search_contract_cretion_block(contract_address, provider);
  var creator = await search_contract_creator(
    contract_address,
    block,
    provider
  );
  return creator;
}

function getArgs(options, address: string) {
  const args: Array<string | number> = options.args || ['%{address}'];
  return args.map((arg) =>
    typeof arg === 'string' ? arg.replace(/%{address}/g, address) : arg
  );
}

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
    [options.methodABI],
    addresses.map((address: any) => [
      options.address,
      options.methodABI.name,
      getArgs(options, address)
    ]),
    { blockTag }
  );

  const owner: string = await find_contract_creator(addresses[0],provider)
  
  return Object.fromEntries(
    await response.map(([value, i]) => [
      owner,
      parseFloat(
        formatUnits(
          options?.output ? value[options.output].toString() : value.toString(),
          options.decimals
        )
      )
    ])
  );
}