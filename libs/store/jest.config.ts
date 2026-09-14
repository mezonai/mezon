export default {
	displayName: 'store',
	rootDir: '../..',
	roots: ['<rootDir>/libs/store/src'],
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
	},
	moduleNameMapper: {
		'^@mezon/utils$': '<rootDir>/libs/utils/src/index.ts',
		'^@mezon/logger$': '<rootDir>/libs/logger/src/index.ts'
	}
};
