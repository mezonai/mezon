const { withNxMetro } = require('@nx/react-native');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
	transformer: {
		ramBundle: 'index',
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: true
			}
		})
	},
	resolver: {
		assetExts: assetExts.filter((ext) => ext !== 'svg'),
		sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg']
	}
};

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
	debug: false,
	extensions: [],
	watchFolders: []
});
