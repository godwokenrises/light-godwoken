const SentryPlugin = require("@sentry/webpack-plugin");

function getProductionSetting() {
  if (process.env.NODE_ENV !== "production") return {};
  return {
    presets: ["@babel/preset-env"],
  };
}

module.exports = {
  babel: {
    ...getProductionSetting(),
  },
  webpack: {
    alias: {},
    plugins: [
      new SentryPlugin({
        release: "light-godwoken@" + process.env.npm_package_version,
        include: "./build",
      }),
    ],
    configure: {
      /* Any webpack configuration options: https://webpack.js.org/configuration */
    },
    configure: (webpackConfig, { env, paths }) => {
      return webpackConfig;
    },
  },
};
