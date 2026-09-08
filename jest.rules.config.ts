import type { Config } from "jest";

const config: Config = {
  displayName: "firestore-rules",
  testEnvironment: "node",
  testMatch: ["<rootDir>/firestore-tests/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.rules.json" }],
  },
  clearMocks: true,
};

export default config;
