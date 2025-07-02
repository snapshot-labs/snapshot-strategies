import { getVp } from '../../../src/utils/vp';
import { strategies, testConfig } from './fixtures/vp-fixtures';

const { network, snapshot, space, evmAddress, starknetAddress } = testConfig;
const TEST_TIMEOUT = 20e3;

describe('VP Calculation Integration Tests', () => {
  describe('getVp()', () => {
    it(
      'should calculate VP for EVM address on evm protocol',
      async () => {
        const scores = await getVp(
          evmAddress,
          network,
          strategies.withDelegation,
          snapshot,
          space
        );

        expect(scores).toMatchSnapshot();
      },
      TEST_TIMEOUT
    );

    it(
      'should calculate VP for EVM address on mixed protocol',
      async () => {
        const scores = await getVp(
          evmAddress,
          network,
          strategies.mixed,
          snapshot,
          space
        );

        expect(scores).toMatchSnapshot();
      },
      TEST_TIMEOUT
    );

    it(
      'should calculate VP for Starknet address on mixed protocol',
      async () => {
        const scores = await getVp(
          starknetAddress,
          network,
          strategies.mixed,
          snapshot,
          space
        );

        expect(scores).toMatchSnapshot();
      },
      TEST_TIMEOUT
    );

    it(
      'should calculate VP for Starknet address on evm protocol',
      async () => {
        const scores = await getVp(
          starknetAddress,
          network,
          strategies.evmOnly,
          snapshot,
          space
        );

        expect(scores).toMatchSnapshot();
      },
      TEST_TIMEOUT
    );

    it.each([
      ['too short address', '0xeF8305E140ac520225DAf050e2f71d5fBcC543'],
      ['too long address', '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7123'],
      ['non-hex characters', '0xeF8305E140ac520225DAf050e2f71d5fBcC543eG'],
      ['missing 0x prefix', 'eF8305E140ac520225DAf050e2f71d5fBcC543e7'],
      ['empty string', ''],
      ['just 0x', '0x'],
      [
        'wrong length for starknet',
        '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203'
      ],
      [
        'invalid mixed case checksum',
        '0xeF8305e140AC520225dAf050E2f71d5fbcC543e7'
      ]
    ])(
      'should throw an error with %s',
      async (_description, invalidAddress) => {
        await expect(
          getVp(
            invalidAddress,
            network,
            strategies.withDelegation,
            snapshot,
            space
          )
        ).rejects.toThrow('invalid address');
      }
    );

    it('should throw an error with single invalid strategy', async () => {
      await expect(
        getVp(evmAddress, network, strategies.singleInvalid, snapshot, space)
      ).rejects.toThrow('invalid strategies: whitelist-invalid');
    });

    it('should throw an error with multiple invalid strategies', async () => {
      await expect(
        getVp(evmAddress, network, strategies.multipleInvalid, snapshot, space)
      ).rejects.toThrow(
        'invalid strategies: strategy-one-invalid, strategy-two-invalid'
      );
    });

    it('should throw an error with empty strategies', async () => {
      await expect(
        getVp(evmAddress, network, [], snapshot, space)
      ).rejects.toThrow('no strategies provided');
    });
  });
});
