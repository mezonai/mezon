const path = require('path');
const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const dotenv = require('dotenv');
const fs = require('fs');

const envFile = process.env.ENV_FILE || '.env';
const envPath = path.resolve(__dirname, envFile);
const envVars = {};

if (fs.existsSync(envPath)) {
	const envConfig = dotenv.config({ path: envPath });
	if (envConfig.parsed) {
		Object.keys(envConfig.parsed).forEach((key) => {
			if (key.startsWith('NX_')) {
				envVars[`process.env.${key}`] = JSON.stringify(envConfig.parsed[key]);
			}
		});
	}
}

envVars['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV || 'development');

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

		config.plugins.push(
			new NodePolyfillPlugin({
				excludeAliases: ['crypto', 'crypto-browserify']
			})
		);

		config.resolve = config.resolve || {};
		config.resolve.fallback = { fs: false };

		config.devServer = config.devServer || {};
		config.devServer.historyApiFallback = true;
		config.devServer.port = 4200;
		config.devServer.host = '127.0.0.1';
		config.devServer.static = {
			directory: path.join(__dirname, 'src/assets'),
			publicPath: '/'
		};

		return merge(config, {
			ignoreWarnings: [/Failed to parse source map/]
		});
	}
);
