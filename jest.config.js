/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],

  //roda só os testes TypeScript da pasta src
  testMatch: ["<rootDir>/src/**/__test__/**/*.test.ts"],

  //ignora qualquer coisa compilada
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  moduleNameMapper: {
    // Use string keys without the /.../ wrappers
    "^@config/(.*)\\.js$": "<rootDir>/src/config/$1",
    "^@controllers/(.*)\\.js$": "<rootDir>/src/controller/$1",
    "^@middlewares/(.*)\\.js$": "<rootDir>/src/middlewares/$1",
    "^@models/(.*)\\.js$": "<rootDir>/src/models/$1",
    "^@repositories/(.*)\\.js$": "<rootDir>/src/repository/$1",
    "^@routes/(.*)\\.js$": "<rootDir>/src/routes/$1",
    "^@services/(.*)\\.js$": "<rootDir>/src/services/$1",

    // This handles your baseUrl: ./src
    // We use a simpler approach: check for common folders
    "^(utils|services|repository|config|controller|middlewares|models|routes)/(.*)\\.js$":
      "<rootDir>/src/$1/$2",

    // Handle relative imports
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
