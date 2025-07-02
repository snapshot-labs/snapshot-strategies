import BasicValidation from '../../../src/validations/basic';

describe('Basic Validation Integration Tests', () => {
  let validation: BasicValidation;

  describe('Constructor and Properties', () => {
    it('should initialize with correct properties', () => {
      validation = new BasicValidation(
        '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
        'test-space',
        '1',
        123456,
        { minScore: 1, strategies: [] }
      );

      expect(validation.id).toBe('basic');
      expect(validation.github).toBe('bonustrack');
      expect(validation.version).toBe('0.2.0');
      expect(validation.title).toBe('Basic');
      expect(validation.description).toBe(
        'Use any strategy to determine if a user can vote.'
      );
      expect(validation.supportedProtocols).toEqual(['evm', 'starknet']);
      expect(validation.hasInnerStrategies).toBe(true);
    });
  });

  describe('validate() method', () => {
    describe('when minScore is not provided', () => {
      it('should return true when minScore is undefined', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          123456,
          { strategies: [] }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      });

      it('should return true when minScore is 0', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          123456,
          { minScore: 0, strategies: [] }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      });

      it('should return true when minScore is null', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          123456,
          { minScore: null, strategies: [] }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      });

      it('should return true even if user is not in whitelist when minScore is undefined', async () => {
        validation = new BasicValidation(
          '0x742D35cc6634c0532925A3b8d4C4d09F6D60E89e',
          'test-space',
          '1',
          'latest',
          {
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should return true even if user is not in whitelist when minScore is 0', async () => {
        validation = new BasicValidation(
          '0x742D35cc6634c0532925A3b8d4C4d09F6D60E89e',
          'test-space',
          '1',
          'latest',
          {
            minScore: 0,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);
    });

    describe('with whitelist strategy', () => {
      it('should validate with whitelist strategy - user in whitelist', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [
                    '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
                    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
                  ]
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate with whitelist strategy - user not in whitelist', async () => {
        validation = new BasicValidation(
          '0x742D35cc6634c0532925A3b8d4C4d09F6D60E89e',
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [
                    '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
                    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
                  ]
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(false);
      }, 30000);

      it('should validate with multiple whitelist strategies', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          'latest',
          {
            minScore: 2,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7']
                }
              },
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should return false when user is in whitelist but minScore is greater than whitelist score', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          'latest',
          {
            minScore: 2,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(false);
      }, 30000);
    });

    describe('address validation', () => {
      it('should return false for invalid EVM address', async () => {
        validation = new BasicValidation(
          'invalid-address',
          'test-space',
          '1',
          123456,
          { minScore: 1, strategies: [] }
        );

        const result = await validation.validate();
        expect(result).toBe(false);
      });

      it('should return false for Starknet address when only evm protocol is supported', async () => {
        const starknetAddress =
          '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A';
        validation = new BasicValidation(
          starknetAddress,
          'test-space',
          '1',
          123456,
          { minScore: 1, strategies: [] }
        );
        validation.supportedProtocols = ['evm'];

        const result = await validation.validate();
        expect(result).toBe(false);
      });

      it('should validate for valid Starknet address when starknet protocol is supported', async () => {
        const starknetAddress =
          '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A';
        validation = new BasicValidation(
          starknetAddress,
          'test-space',
          '1',
          123456,
          { minScore: 0.1, strategies: [] }
        );
        validation.supportedProtocols = ['starknet'];

        const result = await validation.validate();
        expect(typeof result).toBe('boolean');
      });

      it('should validate lowercase EVM address', async () => {
        const lowercaseAddress = '0xef8305e140ac520225daf050e2f71d5fbcc543e7';
        validation = new BasicValidation(
          lowercaseAddress,
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [lowercaseAddress]
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate uppercase EVM address', async () => {
        const uppercaseAddress = '0xEF8305E140AC520225DAF050E2F71D5FBCC543E7';
        validation = new BasicValidation(
          uppercaseAddress,
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [uppercaseAddress]
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate mixed case EVM address', async () => {
        const mixedCaseAddress = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';
        validation = new BasicValidation(
          mixedCaseAddress,
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [mixedCaseAddress]
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate lowercase Starknet address when starknet protocol is supported', async () => {
        const lowercaseStarknetAddress =
          '0x07f71118e351c02f6ec7099c8cdf93aed66ced8406e94631cc91637f7d7f203a';
        validation = new BasicValidation(
          lowercaseStarknetAddress,
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [lowercaseStarknetAddress]
                }
              }
            ]
          }
        );
        validation.supportedProtocols = ['starknet'];

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate uppercase Starknet address when starknet protocol is supported', async () => {
        const uppercaseStarknetAddress =
          '0x07F71118E351C02F6EC7099C8CDF93AED66CED8406E94631CC91637F7D7F203A';
        validation = new BasicValidation(
          uppercaseStarknetAddress,
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [uppercaseStarknetAddress]
                }
              }
            ]
          }
        );
        validation.supportedProtocols = ['starknet'];

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate when user address is lowercase but whitelist has uppercase EVM address', async () => {
        validation = new BasicValidation(
          '0xef8305e140ac520225daf050e2f71d5fbcc543e7',
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xEF8305E140AC520225DAF050E2F71D5FBCC543E7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate when user address is uppercase but whitelist has lowercase EVM address', async () => {
        validation = new BasicValidation(
          '0xEF8305E140AC520225DAF050E2F71D5FBCC543E7',
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xef8305e140ac520225daf050e2f71d5fbcc543e7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate when user address is mixed case but whitelist has different mixed case EVM address', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xEf8305e140Ac520225dAF050E2F71D5FbcC543E7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate when user Starknet address is lowercase but whitelist has uppercase', async () => {
        validation = new BasicValidation(
          '0x07f71118e351c02f6ec7099c8cdf93aed66ced8406e94631cc91637f7d7f203a',
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [
                    '0x07F71118E351C02F6EC7099C8CDF93AED66CED8406E94631CC91637F7D7F203A'
                  ]
                }
              }
            ]
          }
        );
        validation.supportedProtocols = ['starknet'];

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);

      it('should validate when user Starknet address is uppercase but whitelist has lowercase', async () => {
        validation = new BasicValidation(
          '0x07F71118E351C02F6EC7099C8CDF93AED66CED8406E94631CC91637F7D7F203A',
          'test-space',
          '1',
          'latest',
          {
            minScore: 1,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: [
                    '0x07f71118e351c02f6ec7099c8cdf93aed66ced8406e94631cc91637f7d7f203a'
                  ]
                }
              }
            ]
          }
        );
        validation.supportedProtocols = ['starknet'];

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);
    });

    describe('error handling', () => {
      it.todo('should handle invalid network gracefully');

      it('should handle invalid strategy gracefully', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          123456,
          {
            minScore: 1,
            strategies: [
              {
                name: 'non-existent-strategy',
                params: {}
              }
            ]
          }
        );

        await expect(validation.validate()).rejects.toThrow(
          'Invalid strategy: non-existent-strategy'
        );
      }, 10000);
    });

    describe('edge cases', () => {
      it('should handle empty strategies array', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          123456,
          {
            minScore: 1,
            strategies: []
          }
        );

        const result = await validation.validate();
        expect(result).toBe(false);
      }, 10000);

      it('should handle very low minScore requirement', async () => {
        validation = new BasicValidation(
          '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
          'test-space',
          '1',
          'latest',
          {
            minScore: 0.000001,
            strategies: [
              {
                name: 'whitelist',
                params: {
                  addresses: ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7']
                }
              }
            ]
          }
        );

        const result = await validation.validate();
        expect(result).toBe(true);
      }, 30000);
    });
  });
});
