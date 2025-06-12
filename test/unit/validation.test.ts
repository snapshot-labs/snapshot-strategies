import Validation from '../../src/validations/validation';

class TestValidation extends Validation {}

describe('Validation', () => {
  describe('constructor', () => {
    it('should initialize all properties correctly', () => {
      const author = '0x1234567890abcdef1234567890abcdef12345678';
      const space = 'test-space';
      const network = '1';
      const snapshot = 123456;
      const params = { test: 'value' };

      const validation = new TestValidation(
        author,
        space,
        network,
        snapshot,
        params
      );

      expect(validation.author).toBe(author);
      expect(validation.space).toBe(space);
      expect(validation.network).toBe(network);
      expect(validation.snapshot).toBe(snapshot);
      expect(validation.params).toBe(params);
      expect(validation.id).toBe('');
      expect(validation.github).toBe('');
      expect(validation.version).toBe('');
      expect(validation.title).toBe('');
      expect(validation.description).toBe('');
      expect(validation.supportedProtocols).toEqual(['evm']);
      expect(validation.hasInnerStrategies).toBe(false);
    });
  });

  describe('validate() method', () => {
    it('should call doValidate with default author when no custom author provided', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        {}
      );
      const doValidateSpy = jest.spyOn(validation, 'doValidate' as any);

      await validation.validate();

      expect(doValidateSpy).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678'
      );
    });

    it('should call doValidate with custom author when provided', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        {}
      );
      const customAuthor = '0xabcdef1234567890abcdef1234567890abcdef12';
      const doValidateSpy = jest.spyOn(validation, 'doValidate' as any);

      await validation.validate(customAuthor);

      expect(doValidateSpy).toHaveBeenCalledWith(customAuthor);
    });

    it('should validate custom author address type', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['evm'];
      const starknetAddress =
        '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A';

      await expect(validation.validate(starknetAddress)).rejects.toThrow(
        `Address "${starknetAddress}" is not a valid evm address`
      );
    });

    it('should return the result from doValidate', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        {}
      );
      const mockResult = false;
      jest.spyOn(validation, 'doValidate' as any).mockResolvedValue(mockResult);

      const result = await validation.validate();

      expect(result).toBe(mockResult);
    });
  });

  describe('doValidate() method', () => {
    it('should return true by default in base class', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        {}
      );

      const result = await validation.validate();
      expect(result).toBe(true);
    });
  });

  describe('validateStrategiesLength()', () => {
    it('should not throw error when hasInnerStrategies is false', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        { strategies: new Array(10).fill({}) }
      );
      validation.hasInnerStrategies = false;

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should not throw error when hasInnerStrategies is true and strategies length is within limit', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        { strategies: new Array(5).fill({}) }
      );
      validation.hasInnerStrategies = true;

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should not throw error when hasInnerStrategies is true and strategies length equals limit', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        { strategies: new Array(8).fill({}) }
      );
      validation.hasInnerStrategies = true;

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should throw error when hasInnerStrategies is true and strategies length exceeds limit', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        { strategies: new Array(10).fill({}) }
      );
      validation.hasInnerStrategies = true;

      await expect(validation.validate()).rejects.toThrow(
        'Max number of strategies exceeded'
      );
    });

    it('should not throw error when hasInnerStrategies is true and strategies is undefined', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        {}
      );
      validation.hasInnerStrategies = true;

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should not throw error when hasInnerStrategies is true and strategies is empty', async () => {
      const validation = new TestValidation(
        '0x1234567890abcdef1234567890abcdef12345678',
        'test-space',
        '1',
        123456,
        { strategies: [] }
      );
      validation.hasInnerStrategies = true;

      await expect(validation.validate()).resolves.not.toThrow();
    });
  });

  describe('validateAddressType()', () => {
    const VALID_EVM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
    const VALID_STARKNET_ADDRESS =
      '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A';
    const INVALID_ADDRESS = 'invalidAddress';

    it('should not throw error for valid EVM address when evm protocol is supported', async () => {
      const validation = new TestValidation(
        VALID_EVM_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['evm'];

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should not throw error for valid Starknet address when starknet protocol is supported', async () => {
      const validation = new TestValidation(
        VALID_STARKNET_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['starknet'];

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should not throw error for valid EVM address when both protocols are supported', async () => {
      const validation = new TestValidation(
        VALID_EVM_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['evm', 'starknet'];

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should not throw error for valid Starknet address when both protocols are supported', async () => {
      const validation = new TestValidation(
        VALID_STARKNET_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['evm', 'starknet'];

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should not throw error for valid EVM address when only starknet protocol is supported', async () => {
      const validation = new TestValidation(
        VALID_EVM_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['starknet'];

      await expect(validation.validate()).resolves.not.toThrow();
    });

    it('should throw error for valid Starknet address when only evm protocol is supported', async () => {
      const validation = new TestValidation(
        VALID_STARKNET_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['evm'];

      await expect(validation.validate()).rejects.toThrow(
        `Address "${VALID_STARKNET_ADDRESS}" is not a valid evm address`
      );
    });

    it('should throw error for invalid address when evm protocol is supported', async () => {
      const validation = new TestValidation(
        INVALID_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['evm'];

      await expect(validation.validate()).rejects.toThrow(
        `Address "${INVALID_ADDRESS}" is not a valid evm address`
      );
    });

    it('should throw error for invalid address when starknet protocol is supported', async () => {
      const validation = new TestValidation(
        INVALID_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['starknet'];

      await expect(validation.validate()).rejects.toThrow(
        `Address "${INVALID_ADDRESS}" is not a valid starknet address`
      );
    });

    it('should throw error for invalid address when both protocols are supported', async () => {
      const validation = new TestValidation(
        INVALID_ADDRESS,
        'test-space',
        '1',
        123456,
        {}
      );
      validation.supportedProtocols = ['evm', 'starknet'];

      await expect(validation.validate()).rejects.toThrow(
        `Address "${INVALID_ADDRESS}" is not a valid evm or starknet address`
      );
    });
  });
});
