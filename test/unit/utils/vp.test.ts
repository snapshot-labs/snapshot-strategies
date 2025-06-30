import { formatSupportedAddresses } from '../../../src/utils/vp';

describe('formatSupportedAddresses', () => {
  const VALID_EVM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
  const VALID_FORMATTED_EVM_ADDRESS =
    '0x1234567890AbcdEF1234567890aBcdef12345678';
  const VALID_STARKNET_ADDRESS =
    '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A';
  const VALID_FORMATTED_STARKNET_ADDRESS =
    '0x07f71118e351c02f6ec7099c8cdf93aed66ced8406e94631cc91637f7d7f203a';

  // Test data constants
  const INVALID_ADDRESS = 'invalidAddress';
  const EMPTY_ADDRESS = '';
  const SHORT_ADDRESS = '0x123';
  const LONG_ADDRESS = '0x1234567890abcdef1234567890abcdef123456789';
  const WRONG_LENGTH_STARKNET =
    '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203';

  describe('Basic functionality', () => {
    it('should return an empty array when no addresses are provided', () => {
      const result = formatSupportedAddresses([]);
      expect(result).toEqual([]);
    });

    it('should use default protocol when no protocols provided', () => {
      const result = formatSupportedAddresses([VALID_EVM_ADDRESS]);
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });

    it('should filter out unsupported addresses', () => {
      const result = formatSupportedAddresses(
        [VALID_EVM_ADDRESS, INVALID_ADDRESS, SHORT_ADDRESS],
        ['evm']
      );
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });
  });

  describe('Protocol validation', () => {
    it('should throw an error when no protocols are provided', () => {
      expect(() => {
        formatSupportedAddresses([], []);
      }).toThrow('At least one protocol must be specified');
    });

    it('should throw an error for single invalid protocol', () => {
      expect(() => {
        formatSupportedAddresses(
          [VALID_EVM_ADDRESS],
          [
            // @ts-ignore
            'invalidProtocol'
          ]
        );
      }).toThrow('Invalid protocol(s): invalidProtocol');
    });

    it('should throw an error for multiple invalid protocols', () => {
      expect(() => {
        formatSupportedAddresses(
          [VALID_EVM_ADDRESS],
          [
            // @ts-ignore
            'invalidProtocol1',
            // @ts-ignore
            'invalidProtocol2'
          ]
        );
      }).toThrow('Invalid protocol(s): invalidProtocol1, invalidProtocol2');
    });
  });

  describe('EVM protocol filtering', () => {
    it('should format valid EVM addresses correctly', () => {
      const result = formatSupportedAddresses([VALID_EVM_ADDRESS], ['evm']);
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });

    it('should filter out non-EVM addresses when only EVM protocol is specified', () => {
      const result = formatSupportedAddresses(
        [VALID_EVM_ADDRESS, VALID_STARKNET_ADDRESS],
        ['evm']
      );
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });

    it('should filter out invalid length addresses for EVM', () => {
      const result = formatSupportedAddresses(
        [VALID_EVM_ADDRESS, SHORT_ADDRESS, LONG_ADDRESS],
        ['evm']
      );
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });
  });

  describe('Starknet protocol filtering', () => {
    it('should format valid Starknet addresses correctly', () => {
      const result = formatSupportedAddresses(
        [VALID_STARKNET_ADDRESS],
        ['starknet']
      );
      expect(result).toEqual([VALID_FORMATTED_STARKNET_ADDRESS]);
    });

    it('should filter out non-Starknet addresses when only Starknet protocol is specified', () => {
      const result = formatSupportedAddresses(
        [VALID_STARKNET_ADDRESS, VALID_EVM_ADDRESS],
        ['starknet']
      );
      expect(result).toEqual([VALID_FORMATTED_STARKNET_ADDRESS]);
    });

    it('should filter out wrong length addresses for Starknet', () => {
      const result = formatSupportedAddresses(
        [VALID_STARKNET_ADDRESS, WRONG_LENGTH_STARKNET, VALID_EVM_ADDRESS],
        ['starknet']
      );
      expect(result).toEqual([VALID_FORMATTED_STARKNET_ADDRESS]);
    });
  });

  describe('Mixed protocol filtering', () => {
    it('should process both EVM and Starknet addresses correctly', () => {
      const result = formatSupportedAddresses(
        [VALID_EVM_ADDRESS, VALID_STARKNET_ADDRESS],
        ['evm', 'starknet']
      );
      expect(result).toEqual([
        VALID_FORMATTED_EVM_ADDRESS,
        VALID_FORMATTED_STARKNET_ADDRESS
      ]);
    });

    it('should filter out unsupported addresses but keep supported ones', () => {
      const result = formatSupportedAddresses(
        [
          VALID_EVM_ADDRESS,
          INVALID_ADDRESS,
          VALID_STARKNET_ADDRESS,
          SHORT_ADDRESS
        ],
        ['evm', 'starknet']
      );
      expect(result).toEqual([
        VALID_FORMATTED_EVM_ADDRESS,
        VALID_FORMATTED_STARKNET_ADDRESS
      ]);
    });

    it('should maintain order of addresses', () => {
      const result = formatSupportedAddresses(
        [VALID_STARKNET_ADDRESS, VALID_EVM_ADDRESS],
        ['evm', 'starknet']
      );
      expect(result).toEqual([
        VALID_FORMATTED_STARKNET_ADDRESS,
        VALID_FORMATTED_EVM_ADDRESS
      ]);
    });
  });

  describe('Error handling for invalid formatting', () => {
    it('should throw error when address passes regex but fails formatting', () => {
      // This address passes the regex but has invalid checksum and will fail formatting
      const invalidChecksumAddress =
        '0xeF8305e140AC520225dAf050E2f71d5fbcC543e7';

      expect(() => {
        formatSupportedAddresses([invalidChecksumAddress], ['evm']);
      }).toThrow('is not a valid evm address');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string addresses by filtering them out', () => {
      const result = formatSupportedAddresses(
        [VALID_EVM_ADDRESS, EMPTY_ADDRESS],
        ['evm']
      );
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });

    it('should handle mixed valid and invalid addresses', () => {
      const result = formatSupportedAddresses(
        [
          VALID_EVM_ADDRESS,
          'not-an-address',
          VALID_STARKNET_ADDRESS,
          '0x123', // too short
          '0x' + '1'.repeat(80) // too long
        ],
        ['evm', 'starknet']
      );
      expect(result).toEqual([
        VALID_FORMATTED_EVM_ADDRESS,
        VALID_FORMATTED_STARKNET_ADDRESS
      ]);
    });

    it('should return empty array when no addresses match protocols', () => {
      const result = formatSupportedAddresses(
        [VALID_STARKNET_ADDRESS],
        ['evm']
      );
      expect(result).toEqual([]);
    });
  });
});
