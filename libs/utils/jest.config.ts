export default {
	displayName: 'utils',
	rootDir: '../..',
	roots: ['<rootDir>/libs/utils/src'],
	testEnvironment: 'node',
	transform: {
		'^.+\\.[tj]sx?$': [
			'babel-jest',
			{
				babelrc: false,
				configFile: false,
				presets: [
					['@babel/preset-env', { targets: { node: 'current' } }],
					'@babel/preset-typescript',
					['@babel/preset-react', { runtime: 'automatic' }]
				]
			}
		]
	}
};
