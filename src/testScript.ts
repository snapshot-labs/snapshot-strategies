import { getMultiDelegations } from './strategies/multidelegation/utils';

async function fn() {
  console.log(
    await getMultiDelegations('1emu.eth', '1', [
      '0x549a9021661a85b6bc51c07b3a451135848D0048',
      '0xbf363aedd082ddd8db2d6457609b03f9ee74A2f1'
    ])
  );
}

fn();
