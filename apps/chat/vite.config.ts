import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'));
const APP_VERSION = packageJson.version;

export default defineConfig(({ mode }) => {
	const workspaceRoot = path.resolve(__dirname, '../..');
	const env = loadEnv(mode, workspaceRoot, 'NX_');
	const appRoot = path.join(workspaceRoot, 'apps/chat');
	return {
		root: path.join(appRoot, 'src'),
		publicDir: mode === 'production' ? false : path.join(appRoot, 'src/assets'),
		cacheDir: path.join(workspaceRoot, 'node_modules/.vite/apps/chat'),
		base: mode === 'production' ? '/' : './',

		server: {
			port: 4200,
			host: '127.0.0.1',
			open: false,
			proxy: JSON.parse(fs.readFileSync(path.resolve(__dirname, 'proxy.conf.json'), 'utf-8')),
			fs: {
				allow: [workspaceRoot, path.join(workspaceRoot, 'libs/assets/src/assets')]
			}
		},

		preview: {
			port: 4300,
			host: 'localhost'
		},

		plugins: [
			react({
				babel: {
					plugins: [
						['@babel/plugin-proposal-decorators', { legacy: true }],
						['@babel/plugin-proposal-class-properties', { loose: true }]
					]
				}
			}),
			nxViteTsPaths(),
			nodePolyfills({
				include: ['buffer', 'process', 'stream', 'util'],
				globals: {
					Buffer: true,
					global: true,
					process: true
				}
			}),
			viteStaticCopy({
				targets: [
					{
						src: path.join(workspaceRoot, 'libs/assets/src/assets/*'),
						dest: 'assets'
					},
					{
						src: path.join(appRoot, 'src/assets/*'),
						dest: 'assets'
					}
				],
				watch: {
					reloadPageOnChange: true
				}
			}),
			{
				name: 'copy-to-correct-dist',
				closeBundle: async () => {
					const fs = await import('fs-extra');
					const wrongPath = path.join(workspaceRoot, 'apps/dist/apps/chat');
					const correctPath = path.join(workspaceRoot, 'dist/apps/chat');

					if (await fs.pathExists(wrongPath)) {
						await fs.ensureDir(path.dirname(correctPath));
						await fs.copy(wrongPath, correctPath, { overwrite: true });
						await fs.remove(path.join(workspaceRoot, 'apps/dist'));
					}
				}
			}
		],

		define: {
			'process.env.NODE_ENV': JSON.stringify(mode),
			'process.env.APP_VERSION': JSON.stringify(APP_VERSION),
			...Object.keys(env).reduce(
				(acc, key) => {
					acc[`process.env.${key}`] = JSON.stringify(env[key]);
					return acc;
				},
				{} as Record<string, string>
			)
		},

		resolve: {
			alias: {
				'@mezon/store': path.resolve(__dirname, '../../libs/store/src/index.ts'),
				'@mezon/core': path.resolve(__dirname, '../../libs/core/src/index.ts'),
				'@mezon/components': path.resolve(__dirname, '../../libs/components/src/index.ts'),
				'@mezon/transport': path.resolve(__dirname, '../../libs/transport/src/index.ts'),
				'@mezon/utils': path.resolve(__dirname, '../../libs/utils/src/index.ts'),
				'@mezon/ui': path.resolve(__dirname, '../../libs/ui/src/index.ts'),
				'@mezon/themes': path.resolve(__dirname, '../../libs/themes/src/index.ts'),
				'@mezon/translations': path.resolve(__dirname, '../../libs/translations/src/index.ts'),
				'@mezon/logger': path.resolve(__dirname, '../../libs/logger/src/index.ts')
			},
			extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
		},

		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler'
				}
			}
		},

		build: {
			outDir: path.resolve(__dirname, '../../dist/apps/chat'),
			emptyOutDir: true,
			reportCompressedSize: true,
			commonjsOptions: {
				transformMixedEsModules: true
			},
			rollupOptions: {
				output: {
					entryFileNames: '[name].[hash].js',
					chunkFileNames: '[name].[hash].chunk.js',
					assetFileNames: (assetInfo) => {
						if (assetInfo.name?.endsWith('.css')) {
							return '[name].[hash].css';
						}
						return 'assets/[name].[hash][ext]';
					},
					manualChunks: (id) => {
						if (id.includes('node_modules')) {
							if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
								return 'vendor-react';
							}
							if (id.includes('react-router')) {
								return 'vendor-router';
							}
							if (id.includes('@reduxjs') || id.includes('redux') || id.includes('react-redux')) {
								return 'vendor-redux';
							}
							if (id.includes('mezon-js')) {
								return 'vendor-mezon';
							}
							if (id.includes('mezon-protobuf')) {
								return 'vendor-protobuf';
							}
						}

						if (id.includes('libs/translations/src/languages/en')) {
							return 'i18n-en';
						}
						if (id.includes('libs/translations/src/languages/vi')) {
							return 'i18n-vi';
						}
					}
				}
			},
			sourcemap: mode === 'development',
			minify: mode === 'production' ? 'esbuild' : false,
			target: 'esnext',
			chunkSizeWarningLimit: 1000
		},

		optimizeDeps: {
			include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux', 'mezon-js']
		}
	};
});
