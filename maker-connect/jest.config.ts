import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    'features/**/*.ts',
    '!app/api/projects/[id]/export/**',
    '!app/api/projects/[id]/extract/**',
    '!features/social/projects/api.ts',
    '!lib/pdf-export-queue.ts',
    '!lib/pdf-service.ts',
    '!lib/prisma.ts',
    '!lib/s3-service.ts',
    '!lib/extraction-output-schema.ts',
  ],
};

export default config;
