module.exports = {
  clearMocks: true,
  moduleFileExtensions: ["js", "ts"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  verbose: true,
  testEnvironment: "node",
  preset: "ts-jest",
  setupFilesAfterEnv: [],
};
