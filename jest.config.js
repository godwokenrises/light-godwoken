module.exports = {
  testMatch: ["<rootDir>/**/__tests__/**/?(*.)(spec|test).ts", "<rootDir>/**/?(*.)(spec|test).ts"],
  preset: "ts-jest/presets/default-esm",
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  testEnvironment: "node",
};
