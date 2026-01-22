module.exports = (config) => {
	if (config.module && config.module.rules) {
		config.module.rules.forEach((rule) => {
			if (rule.use && Array.isArray(rule.use)) {
				rule.use.forEach((loader) => {
					if (loader.loader && loader.loader.includes('ts-loader')) {
						loader.options = loader.options || {};
						loader.options.transpileOnly = true;
					}
				});
			}
		});
	}

	return config;
};
