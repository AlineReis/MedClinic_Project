/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@controllers/(.*)$': '<rootDir>/src/controller/$1',
        '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
        '^@models/(.*)$': '<rootDir>/src/models/$1',
        '^@repositories/(.*)$': '<rootDir>/src/repository/$1',
        '^@routes/(.*)$': '<rootDir>/src/routes/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1'
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
    },
    moduleExtensionsClass: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
