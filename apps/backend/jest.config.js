module.exports = {
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testTimeout: 10000,
  collectCoverageFrom: [
    '**/*.service.ts',
    '!**/*.spec.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^bcrypt$': '<rootDir>/__mocks__/bcrypt.js',
  },
};