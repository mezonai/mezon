const path = require('path');
const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const dotenv = require('dotenv');
const fs = require('fs');

const packageJson = require('../../package.json');
const APP_VERSION = packageJson.version;

const envFile = process.env.ENV_FILE || '.env';
const envPath = path.resolve(__dirname, envFile);
let envVars = {};

if (fs.existsSync(envPath)) {
  const envConfig = dotenv.config({ path: envPath });
  if (envConfig.parsed) {
    Object.keys(envConfig.parsed).forEach(key => {
      if (key.startsWith('NX_')) {
        envVars[`process.env.${key}`] = JSON.stringify(envConfig.parsed[key]);
      }
    });
  }
}

envVars['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV || 'development');
envVars['process.env.APP_VERSION'] = JSON.stringify(APP_VERSION);

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
    svgr: false
  }),
  (config) => {
    // Workaround for Nx React plugin findIndex bug
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    // Update the webpack config as needed here.
    // e.g. `config.plugins.push(new MyPlugin())`
    config.plugins = config.plugins || [];

    // Add DefinePlugin to inject environment variables
    config.plugins.push(new webpack.DefinePlugin(envVars));

    config.plugins.push(new NodePolyfillPlugin());

    config.resolve = config.resolve || {};
    config.resolve.fallback = { "fs": false };

    if (config.output && process.env.NODE_ENV === 'production') {
      config.output.filename = config.output.filename || '[name].[contenthash].js';
      config.output.chunkFilename = config.output.chunkFilename || '[name].[contenthash].chunk.js';
      config.optimization = config.optimization || {};
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';

      const versionHash = require('crypto').createHash('md5').update(APP_VERSION + Date.now().toString()).digest('hex').substring(0, 8);
      config.output.filename = `[name].${versionHash}.[contenthash].js`;
      config.output.chunkFilename = `[name].${versionHash}.[contenthash].chunk.js`;
      config.output.assetModuleFilename = `assets/[name].${versionHash}.[contenthash][ext]`;
    }

    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/assets/.well-known'),
            noErrorOnMissing: true,
            to({ context, absoluteFilename }) {
              const filename = path.basename(absoluteFilename);
              if (filename === 'apple-app-site-association.json') {
                return path.posix.join('.well-known', 'apple-app-site-association');
              }
              return path.posix.join('.well-known', filename);
            },
          },
          {
            from: path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
            to: 'pdf.worker.min.mjs',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
            to: 'assets/pdf.worker.min.mjs',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
            to: 'pdf.worker.min.js',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
            to: 'assets/pdf.worker.min.js',
            noErrorOnMissing: true,
          },
        ],
      })
    );

    config.devServer = config.devServer || {};

    config.devServer.allowedHosts = 'all';

    const trustedDomains = [
      '\'self\'',
      '*.mezon.ai',
      '*.nccsoft.vn',
      'media.tenor.com',
      '*.googletagmanager.com',
      '*.google-analytics.com',
      '*.googlesyndication.com',
      '*.gstatic.com',
      '*.googleapis.com',
      'https://cdn.jsdelivr.net',
      'googleads.g.doubleclick.net'
    ].join(' ');
    const basePolicies = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${trustedDomains}`,
      `style-src 'self' 'unsafe-inline' ${trustedDomains}`,
      `font-src 'self' data: ${trustedDomains}`,
      `object-src 'none'`,
      `worker-src 'self' blob: ${trustedDomains}`,
      `manifest-src 'self' ${trustedDomains}`
    ];

          const resourcePolicies = [
        `img-src 'self' data: blob: https: http: ${trustedDomains}`,
        `connect-src 'self' ws: wss: https: http: ${trustedDomains}`,
        `media-src 'self' blob: https: http: ${trustedDomains}`,
      ];

    const iframePolicies = [
      `frame-ancestors *`,
      `child-src *`,
      `frame-src *`
    ]

    const cspPolicy = [...basePolicies, ...resourcePolicies, ...iframePolicies].join('; ');

    // Add security headers to prevent XSS attacks
    config.devServer.headers = {
      'Content-Security-Policy': cspPolicy,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };

    config.devServer.static = {
      directory: path.join(__dirname, 'src/assets'),
      publicPath: '/',
    };

    config.devServer.historyApiFallback = {
      rewrites: [
        {
          from: /^\/\.well-known\/apple-app-site-association$/,
          to: '/.well-known/apple-app-site-association.json',
        },
      ],
    };

    return merge(config, {
      ignoreWarnings: [/Failed to parse source map/]
    });
  },
);
