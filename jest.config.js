module.exports = {
  roots: ['<rootDir>/test'],
  testTimeout: 120000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '/test(/(integration|unit))?/.*\\.test\\.ts$',
  fakeTimers: {
    enableGlobally: true
  }
};
