function getProductionSetting() {
  if (process.env.NODE_ENV !== 'production') return {};
  return {
    presets: ['@babel/preset-env'],
  };
}

module.exports = {
  babel: {
    ...getProductionSetting(),
  },
};