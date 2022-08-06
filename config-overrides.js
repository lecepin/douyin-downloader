const { override, addLessLoader, adjustStyleLoaders } = require('customize-cra');

module.exports = override(
  addLessLoader({ lessOptions: { javascriptEnabled: true } }),
  adjustStyleLoaders(({ use: [, , postcss] }) => {
    postcss.options = { postcssOptions: postcss.options };
  }),
  function (config) { return config; },
);
