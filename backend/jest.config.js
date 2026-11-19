// Jest runs the TypeScript tests in src/tests. ts-jest compiles them on the fly.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.test.ts'],
  // Gives every test a fake secret and silences the logger (see src/tests/setupEnv.ts)
  setupFiles: ['<rootDir>/src/tests/setupEnv.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/tests/**', '!src/app.ts', '!src/config/db.ts', '!src/config/passport.ts', '!src/routes/**', '!src/models/**'],
}
