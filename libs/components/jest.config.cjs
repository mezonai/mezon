module.exports = {
	displayName: 'components',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/src/**/*.spec.[jt]s?(x)'],
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{ tsconfig: { target: 'ES2020', module: 'commonjs', jsx: 'react-jsx', esModuleInterop: true, skipLibCheck: true } }
		]
	},
	coverageDirectory: '../../coverage/libs/components'
};
