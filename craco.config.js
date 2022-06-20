const SentryPlugin = require("@sentry/webpack-plugin");

function getProductionSetting() {
  if (process.env.NODE_ENV !== "production") return {};
  return {
    presets: ["@babel/preset-env"],
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
      new SentryPlugin({
        release: "light-godwoken@" + process.env.npm_package_version + "@" + commitHash,
        include: "./build",
      }),

      /* Any webpack configuration options: https://webpack.js.org/configuration */
    ],
    configure: (webpackConfig, { env, paths }) => {
      return webpackConfig;
    },
  },
};
