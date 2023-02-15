// const SentryPlugin = require("@sentry/webpack-plugin");

const commitHash = require("child_process").execSync("git rev-parse --short HEAD");

module.exports = {
  babel: {
    presets: ["@babel/preset-env"],
    plugins: [
      "@babel/plugin-proposal-private-property-in-object",
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-private-methods",
    ],
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
