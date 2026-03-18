import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

function nodePolyfillsPlugin(): Plugin {
	return {
		name: 'node-polyfills',
		transformIndexHtml() {
			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: [
						"import { Buffer } from 'buffer';",
						'globalThis.Buffer = globalThis.Buffer || Buffer;',
						"import process from 'process/browser';",
						'globalThis.process = globalThis.process || process;',
						'globalThis.global = globalThis.global || globalThis;'
					].join('\n'),
					injectTo: 'head-prepend'
				}
			];
		},
		config() {
			return {
				resolve: {
					alias: {
						buffer: 'buffer',
						process: 'process/browser',
						stream: 'stream-browserify',
						util: 'util'
					}
				}
			};
		}
	};
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'));
const APP_VERSION = packageJson.version;

export default defineConfig(({ mode }) => {
	const workspaceRoot = path.resolve(__dirname, '../..');
	const env = loadEnv(mode, workspaceRoot, 'NX_');
	const appRoot = path.join(workspaceRoot, 'apps/discover');
	return {
		root: path.join(appRoot, 'src'),
		publicDir: mode === 'production' ? false : path.join(appRoot, 'src/assets'),
		cacheDir: path.join(workspaceRoot, 'node_modules/.vite/apps/discover'),
		base: mode === 'production' ? '/' : './',

		server: {
			port: 4200,
			host: '127.0.0.1',
			open: false,
			historyApiFallback: true,
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
			nodePolyfillsPlugin(),
			viteStaticCopy({
				targets: [
					{
						src: path.join(workspaceRoot, 'libs/assets/src/assets/*').replace(/\\/g, '/'),
						dest: 'assets'
					},
					{
						src: path.join(appRoot, 'src/assets/*').replace(/\\/g, '/'),
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
					const wrongPath = path.join(workspaceRoot, 'apps/dist/apps/discover');
					const correctPath = path.join(workspaceRoot, 'dist/apps/discover');

					if (await fs.pathExists(wrongPath)) {
						await fs.ensureDir(path.dirname(correctPath));
						await fs.copy(wrongPath, correctPath, { overwrite: true });
						await fs.remove(path.join(workspaceRoot, 'apps/dist'));
					}
				}
			},
			...(process.env.ANALYZE === 'true'
				? [
						visualizer({
							open: true,
							filename: path.join(workspaceRoot, 'dist/stats.html'),
							gzipSize: true,
							brotliSize: true,
							template: 'treemap'
						})
					]
				: [])
		],

		define: {
			global: 'globalThis',
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

		optimizeDeps: {
			include: [
				'protobufjs/minimal',
				'long',
				'mezon-js-protobuf',
				'react',
				'react-dom',
				'react-router-dom',
				'@reduxjs/toolkit',
				'react-redux',
				'mezon-js'
			]
		},

		resolve: {
			alias: {
				'@mezon/store': path.resolve(__dirname, '../../libs/store/src/index.ts'),
				'@mezon/core': path.resolve(__dirname, '../../libs/core/src/index.ts'),
				'@mezon/components': path.resolve(__dirname, '../../libs/components/src/index.ts'),
				'@mezon/transport': path.resolve(__dirname, '../../libs/transport/src/index.ts'),
				'@mezon/utils': path.resolve(__dirname, '../../libs/utils/src/index.ts'),
				'@mezon/ui/lib': path.resolve(__dirname, '../../libs/ui/src/lib'),
				'@mezon/ui': path.resolve(__dirname, '../../libs/ui/src/index.ts'),
				'@mezon/themes': path.resolve(__dirname, '../../libs/themes/src/index.ts'),
				'@mezon/translations': path.resolve(__dirname, '../../libs/translations/src/index.ts'),
				'@mezon/logger': path.resolve(__dirname, '../../libs/logger/src/index.ts'),
				'@mezon/assets': path.resolve(__dirname, '../../libs/assets/src/index.ts'),
				'@mezon/chat-scroll': path.resolve(__dirname, '../../libs/chat-scroll/src/index.ts'),
				'@mezon/package-js': path.resolve(__dirname, '../../package.json'),
				'mezon-js-protobuf': path.resolve(__dirname, '../../node_modules/mezon-js-protobuf/dist/mezon-js-protobuf.esm.mjs')
			},
			extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
			conditions: ['import', 'module', 'browser', 'default']
		},

		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler'
				}
			}
		},

		build: {
			outDir: path.resolve(__dirname, '../../dist/apps/discover'),
			emptyOutDir: true,
			reportCompressedSize: true,
			rolldownOptions: {
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
			minify: mode === 'production',
			target: 'esnext',
			chunkSizeWarningLimit: 1000
		}
	};
});
