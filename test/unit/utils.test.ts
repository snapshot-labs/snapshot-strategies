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
    const input = [
      VALID_EVM_ADDRESS,
      'invalidEVMAddress',
      VALID_STARKNET_ADDRESS,
      ''
    ];

    it('should return an empty array when no addresses are provided', () => {
      const result = getFormattedAddressesByProtocol([]);
      expect(result).toEqual([]);
    });

    it('should return an empty array when protocol is not valid', () => {
      const result = getFormattedAddressesByProtocol(input, [
        // @ts-ignore
        'invalidProtocol'
      ]);
      expect(result).toEqual([]);
    });

    it('should throw an error when no protocol is provided', () => {
      expect(() => {
        getFormattedAddressesByProtocol([], []);
      }).toThrow();
    });

    it('should use evm as default protocol when no protocols provided', () => {
      const result = getFormattedAddressesByProtocol(input);
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });

    it('should prioritize evm when address is valid for both protocols and both are specified', () => {
      const result = getFormattedAddressesByProtocol(
        [VALID_EVM_ADDRESS],
        ['evm', 'starknet']
      );
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });

    it('should return only formatted EVM addresses on evm protocol', () => {
      const result = getFormattedAddressesByProtocol(input, ['evm']);
      expect(result).toEqual([VALID_FORMATTED_EVM_ADDRESS]);
    });

    it('should return only formatted starknet addresses on starknet protocol', () => {
      const result = getFormattedAddressesByProtocol(input, ['starknet']);
      expect(result).toEqual([VALID_FORMATTED_STARKNET_ADDRESS]);
    });

    it('should return both formatted starknet and evm addresses on starknet and evm protocol', () => {
      const result = getFormattedAddressesByProtocol(input, [
        'starknet',
        'evm'
      ]);
      expect(result).toEqual([
        VALID_FORMATTED_EVM_ADDRESS,
        VALID_FORMATTED_STARKNET_ADDRESS
      ]);
    });

    it('should return empty array when all addresses are invalid for specified protocol', () => {
      const result = getFormattedAddressesByProtocol(
        ['invalidAddress'],
        ['evm']
      );
      expect(result).toEqual([]);
    });

    it('should return empty array when all addresses are invalid for specified protocol', () => {
      const result = getFormattedAddressesByProtocol(
        ['invalidAddress'],
        ['starknet']
      );
      expect(result).toEqual([]);
    });
  });
});
