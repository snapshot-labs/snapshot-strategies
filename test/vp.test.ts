import { getVp } from '../src/utils/vp';

const address = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';
const space = 'cvx.eth';
const network = '1';
const snapshot = 15354134;
const strategies = [
  {
    name: 'erc20-balance-of',
    params: {
      symbol: 'CVX',
      address: '0x72a19342e8F1838460eBFCCEf09F6585e32db86E',
      decimals: 18
    }
  },
  {
    name: 'eth-balance',
    network: '100',
    params: {}
  },
  {
    name: 'eth-balance',
    network: '1',
    params: {}
  },
  {
    name: 'eth-balance',
    network: '10',
    params: {}
  }
];

describe('', () => {
  it('getVp without delegation', async () => {
    const scores = await getVp(
      address,
      network,
      strategies,
      snapshot,
      space,
      false
    );
    expect(scores).toMatchSnapshot();
    console.log(scores);
  }, 20e3);

  it('getVp with delegation', async () => {
    const scores = await getVp(
      address,
      network,
      strategies,
      snapshot,
      space,
      true
    );
    expect(scores).toMatchSnapshot();
    console.log(scores);
  }, 20e3);
});
