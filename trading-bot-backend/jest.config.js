module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleNameMapper: {
    '^puppeteer$': '<rootDir>/tests/__mocks__/puppeteer.js'
  }
};
