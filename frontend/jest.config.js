export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      diagnostics: {
        ignoreCodes: [1343]
      },
      astTransformers: {
        before: [
          {
            path: 'ts-jest-mock-import-meta',
            options: {
              metaObjectReplacement: {
                env: {
                  VITE_COGNITO_USER_POOL_ID: 'test-pool-id',
                  VITE_COGNITO_USER_POOL_CLIENT_ID: 'test-client-id',
                  VITE_COGNITO_REGION: 'us-east-1',
                  MODE: 'test',
                  DEV: false,
                  PROD: false,
                  SSR: false
                }
              }
            }
          }
        ]
      }
    }],
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'import.meta': {
      env: {
        VITE_COGNITO_USER_POOL_ID: 'test-pool-id',
        VITE_COGNITO_USER_POOL_CLIENT_ID: 'test-client-id',
        VITE_COGNITO_REGION: 'us-east-1',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false
      }
    }
  }
};