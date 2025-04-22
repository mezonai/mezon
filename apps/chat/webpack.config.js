const path = require('path');
const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const EXTERNALS_SCRIPTS = [];

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    optimization: true,
    namedChunks: true,
    index: 'index.html',
    generateIndexHtml: true,
    scripts: EXTERNALS_SCRIPTS
  }),
  withReact({
    // Uncomment this line if you don't want to use SVGR
    // See: https://react-svgr.com/
    // svgr: false
  }),
  (config) => {
    // Update the webpack config as needed here.
    // e.g. `config.plugins.push(new MyPlugin())`
    config.plugins = config.plugins || [];
    config.plugins.push(new NodePolyfillPlugin());

    config.resolve = config.resolve || {};
    config.resolve.fallback = { "fs": false };

    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/assets/.well-known'),
            to: '.well-known',
            noErrorOnMissing: true,
          },
        ],
      })
    );

    config.devServer = config.devServer || {};

    config.devServer.static = {
      directory: path.join(__dirname, 'src/assets'),
      publicPath: '/',
    };

    config.devServer.historyApiFallback = {
      rewrites: [
        {
          from: /^\/\.well-known\/.*$/,
          to: (context) => context.parsedUrl.pathname,
        },
      ],
    };

    return merge(config, {
      ignoreWarnings: [/Failed to parse source map/]
    });
  },
);
