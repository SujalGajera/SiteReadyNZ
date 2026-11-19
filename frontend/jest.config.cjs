// Jest + React Testing Library for the frontend. The file ends in .cjs because package.json says "type": "module".
module.exports = {
  testEnvironment: 'jsdom', // a pretend browser, so components can be rendered and clicked
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    // Vite-only setting replaced by a fixed value, since Jest does not understand import.meta
    '^@/config/env$': '<rootDir>/src/tests/envStub.ts',
    // The "@/" shortcut used all over the app
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css)$': '<rootDir>/src/tests/styleStub.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/tests/**', '!src/main.tsx', '!src/sw/**', '!src/assets/**', '!src/components/ui/**', '!src/vite-env.d.ts'],
}
