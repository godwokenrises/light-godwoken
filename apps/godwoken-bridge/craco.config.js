// const SentryPlugin = require("@sentry/webpack-plugin");

function getProductionSetting() {
  /*if (process.env.NODE_ENV !== "production") return {
    presets: ["@babel/preset-env"],
  };*/
  return {
    presets: [
      [
        "@babel/preset-env",
        {
          loose: false,
        },
      ],
    ],
    plugins: [
      "@babel/plugin-proposal-private-property-in-object",
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-private-methods",
    ],
  };
}

const commitHash = require("child_process").execSync("git rev-parse --short HEAD");

module.exports = {
  babel: {
    ...getProductionSetting(),
  },
  webpack: {
    alias: {},
    plugins: [
      /*new SentryPlugin({
        release: "light-godwoken@" + process.env.npm_package_version + "@" + commitHash,
        include: "./build",
      }),*/
      /* Any webpack configuration options: https://webpack.js.org/configuration */
    ],
    configure: (webpackConfig, { env, paths }) => {
      return webpackConfig;
    },
  },
};
