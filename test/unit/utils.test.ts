import { getFormattedAddressesByProtocol } from '../../src/utils';

describe('utils', () => {
  const VALID_EVM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
  const VALID_FORMATTED_EVM_ADDRESS =
    '0x1234567890AbcdEF1234567890aBcdef12345678';
  const VALID_STARKNET_ADDRESS =
    '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A';
  const VALID_FORMATTED_STARKNET_ADDRESS =
    '0x07f71118e351c02f6ec7099c8cdf93aed66ced8406e94631cc91637f7d7f203a';

  describe('getFormattedAddressesByProtocol()', () => {
    // Test data constants
    const INVALID_ADDRESS = 'invalidAddress';
    const EMPTY_ADDRESS = '';
    const STARKNET_ONLY_ADDRESS = VALID_STARKNET_ADDRESS;
    const EVM_ONLY_ADDRESS = VALID_EVM_ADDRESS;

    describe('Basic functionality', () => {
      it('should return an empty array when no addresses are provided', () => {
        const result = getFormattedAddressesByProtocol([]);
        expect(result).toEqual([]);
      });

      it('should use evm as default protocol when no protocols provided', () => {
        const result = getFormattedAddressesByProtocol([EVM_ONLY_ADDRESS]);
        expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
      });
    });

    describe('Protocol validation', () => {
      it('should throw an error when no protocols are provided', () => {
        expect(() => {
          getFormattedAddressesByProtocol([], []);
        }).toThrow('At least one protocol must be specified');
      });

      it('should throw an error for single invalid protocol', () => {
        expect(() => {
          getFormattedAddressesByProtocol(
            [EVM_ONLY_ADDRESS],
            [
              // @ts-ignore
              'invalidProtocol'
            ]
          );
        }).toThrow('Invalid protocol(s): invalidProtocol');
      });

      it('should throw an error for multiple invalid protocols', () => {
        expect(() => {
          getFormattedAddressesByProtocol(
            [EVM_ONLY_ADDRESS],
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

    describe('Single protocol formatting', () => {
      it('should format EVM addresses correctly', () => {
        const result = getFormattedAddressesByProtocol(
          [EVM_ONLY_ADDRESS],
          ['evm']
        );
        expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
      });

      it('should format Starknet addresses correctly', () => {
        const result = getFormattedAddressesByProtocol(
          [STARKNET_ONLY_ADDRESS],
          ['starknet']
        );
        expect(result).toEqual([VALID_FORMATTED_STARKNET_ADDRESS]);
      });
    });

    describe('Multiple protocol formatting', () => {
      it('should prioritize EVM when address is valid for both protocols', () => {
        const result = getFormattedAddressesByProtocol(
          [EVM_ONLY_ADDRESS],
          ['evm', 'starknet']
        );
        expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
      });

      it('should fall back to Starknet when EVM formatting fails', () => {
        const result = getFormattedAddressesByProtocol(
          [STARKNET_ONLY_ADDRESS],
          ['evm', 'starknet']
        );
        expect(result).toEqual([VALID_FORMATTED_STARKNET_ADDRESS]);
      });

      it('should format addresses from different protocols correctly', () => {
        const result = getFormattedAddressesByProtocol(
          [EVM_ONLY_ADDRESS, STARKNET_ONLY_ADDRESS],
          ['evm', 'starknet']
        );
        expect(result).toEqual([
          VALID_FORMATTED_EVM_ADDRESS,
          VALID_FORMATTED_STARKNET_ADDRESS
        ]);
      });

      it('should maintain protocol order independence for multiple valid protocols', () => {
        const result1 = getFormattedAddressesByProtocol(
          [EVM_ONLY_ADDRESS],
          ['evm', 'starknet']
        );
        const result2 = getFormattedAddressesByProtocol(
          [EVM_ONLY_ADDRESS],
          ['starknet', 'evm']
        );
        expect(result1).toEqual(result2);
      });
    });

    describe('Error handling', () => {
      it('should throw an error for completely invalid addresses', () => {
        expect(() => {
          getFormattedAddressesByProtocol([INVALID_ADDRESS], ['evm']);
        }).toThrow('is not a valid evm address');
      });

      it('should throw an error for empty string addresses', () => {
        expect(() => {
          getFormattedAddressesByProtocol([EMPTY_ADDRESS], ['evm']);
        }).toThrow('is not a valid evm address');
      });

      it('should throw an error when address is invalid for all specified protocols', () => {
        expect(() => {
          getFormattedAddressesByProtocol(
            [INVALID_ADDRESS],
            ['evm', 'starknet']
          );
        }).toThrow('is not a valid evm or starknet address');
      });

      it('should throw an error on first invalid address in mixed array', () => {
        expect(() => {
          getFormattedAddressesByProtocol(
            [EVM_ONLY_ADDRESS, INVALID_ADDRESS, STARKNET_ONLY_ADDRESS],
            ['evm', 'starknet']
          );
        }).toThrow('is not a valid evm or starknet address');
      });
    });
  });
});
