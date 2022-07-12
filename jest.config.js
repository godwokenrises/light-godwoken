module.exports = {
  testMatch: ["<rootDir>/**/?(*.)(spec|test).ts"],
  preset: "ts-jest/presets/default-esm",
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  testEnvironment: "jsdom",
};
