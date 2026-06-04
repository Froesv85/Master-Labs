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
    '!features/social/projects/api.ts',
    '!lib/pdf-export-queue.ts',
    '!lib/pdf-service.ts',
    '!lib/prisma.ts',
    '!lib/s3-service.ts',
    '!lib/extraction-output-schema.ts',
    '!lib/auth.ts',
    '!lib/ollama.ts',
    '!lib/pinecone.ts',
  ],
};

export default config;
