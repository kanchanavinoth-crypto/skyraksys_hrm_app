
// jest.config.js
module.exports = {
  // Frontend tests
  projects: [
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/frontend/src/**/*.test.{js,jsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      collectCoverageFrom: [
        'frontend/src/**/*.{js,jsx}',
        '!frontend/src/index.js',
        '!frontend/src/reportWebVitals.js',
        '!frontend/src/**/*.stories.js'
      ],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/backend/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
      collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/node_modules/**',
        '!backend/migrations/**',
        '!backend/seeders/**'
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  ],
  coverageDirectory: 'coverage',
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html']
};
