import { getDelegations } from '../src/utils/vp';

const address = '0x14F83fF95D4Ec5E8812DDf42DA1232b0ba1015e6';
const space = 'cvx.eth';
const network = '1';
const snapshot = 15109700;

describe('', () => {
  it('getDelegations', async () => {
    const delegations = await getDelegations(address, network, snapshot, space);
    expect(delegations).toMatchSnapshot();
    console.log(delegations);
  }, 20e3);
});
