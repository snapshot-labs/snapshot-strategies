module.exports = {
  roots: ['<rootDir>/test'],
  testTimeout: 120000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '/test(/(integration|unit))?/.*\\.spec\\.ts$'
};
