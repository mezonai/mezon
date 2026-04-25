import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
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
			},
			headers: {
				'Content-Security-Policy': [
					"default-src 'self'",
					"script-src 'self' 'wasm-unsafe-eval' 'sha256-Z2/iFzh9VMlVkEOar1f/oSHWwQk3ve1qk/C2WdsC4Xk=' blob: *.mezon.ai *.googletagmanager.com *.google-analytics.com *.googlesyndication.com *.gstatic.com *.googleapis.com https://cdn.jsdelivr.net",
					"style-src 'self' 'unsafe-inline' *.mezon.ai *.googleapis.com *.gstatic.com https://cdn.jsdelivr.net",
					"font-src 'self' data: *.mezon.ai *.gstatic.com *.googleapis.com https://cdn.jsdelivr.net",
					"object-src 'none'",
					"worker-src 'self' 'wasm-unsafe-eval' blob:",
					"manifest-src 'self'",
					"img-src 'self' data: blob: https: *.mezon.ai media.tenor.com *.googleusercontent.com",
					"connect-src 'self' ws: wss: https: blob: *.mezon.ai media.tenor.com *.googletagmanager.com *.google-analytics.com *.googleapis.com *.gstatic.com https://cdn.jsdelivr.net",
					"media-src 'self' blob: https: *.mezon.ai media.tenor.com",
					"child-src 'self' https://www.youtube.com https://www.tiktok.com https://www.facebook.com https://player.vimeo.com",
					"frame-src 'self' https://www.youtube.com https://www.tiktok.com https://www.facebook.com https://player.vimeo.com",
					"base-uri 'self'",
					"form-action 'self' *.mezon.ai",
					"frame-ancestors 'self'"
				].join('; ')
			}
		},

		preview: {
			port: 4300,
			host: 'localhost'
		},

		plugins: [
			react(),
			nxViteTsPaths(),
			nodePolyfills({
				include: ['buffer', 'process', 'stream', 'util'],
				exclude: ['crypto'],
				globals: {
					Buffer: true,
					global: true,
					process: true
				}
			}),
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
				name: 'serve-libs-assets-in-dev',
				apply: 'serve' as const,
				configureServer(server: import('vite').ViteDevServer) {
					const assetsRoot = path.join(workspaceRoot, 'libs/assets/src/assets');
					const mime: Record<string, string> = {
						'.css': 'text/css',
						'.svg': 'image/svg+xml',
						'.png': 'image/png',
						'.jpg': 'image/jpeg',
						'.jpeg': 'image/jpeg',
						'.webp': 'image/webp',
						'.mp3': 'audio/mpeg'
					};
					server.middlewares.use(
						'/assets',
						(req: import('http').IncomingMessage, res: import('http').ServerResponse, next: (err?: unknown) => void) => {
							const url = (req.url ?? '').split('?')[0];
							const rel = decodeURIComponent(url.replace(/^\/+/, ''));
							const full = path.join(assetsRoot, rel);
							if (!full.startsWith(assetsRoot)) return next();
							fs.stat(full, (err, stat) => {
								if (err || !stat.isFile()) return next();
								res.setHeader('Content-Type', mime[path.extname(full).toLowerCase()] ?? 'application/octet-stream');
								fs.createReadStream(full).pipe(res);
							});
						}
					);
				}
			},
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
			'process.env.BABEL_ENV': JSON.stringify(process.env.BABEL_ENV ?? ''),
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
			],
			rolldownOptions: {
				target: 'esnext'
			}
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
				'@mezon/logger': path.resolve(__dirname, '../../libs/logger/src/index.ts'),
				'mezon-js-protobuf': path.resolve(__dirname, '../../node_modules/mezon-js-protobuf/dist/mezon-js-protobuf.esm.mjs')
			},
			extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
			conditions: ['import', 'module', 'browser', 'default']
		},

		build: {
			outDir: path.resolve(__dirname, '../../dist/apps/chat'),
			emptyOutDir: true,
			reportCompressedSize: true,
			commonjsOptions: {
				transformMixedEsModules: true
			},
			rolldownOptions: {
				output: {
					entryFileNames: '[name].[hash].js',
					chunkFileNames: '[name].[hash].chunk.js',
					assetFileNames: (assetInfo: { name?: string }) => {
						if (assetInfo.name?.endsWith('.css')) {
							return '[name].[hash].css';
						}
						return 'assets/[name].[hash][ext]';
					},
					advancedChunks: {
						groups: [
							{ name: 'vendor-tiptap', test: /node_modules\/@tiptap/ },
							{ name: 'vendor-datepicker', test: /node_modules\/react-datepicker/ },
							{ name: 'vendor-pdf', test: /node_modules\/(react-pdf|pdfjs-dist)/ },
							{ name: 'vendor-router', test: /node_modules\/react-router/ },
							{ name: 'vendor-redux', test: /node_modules\/(@reduxjs|redux|react-redux)/ },
							{ name: 'vendor-protobuf', test: /node_modules\/mezon-protobuf/ },
							{ name: 'vendor-mezon', test: /node_modules\/mezon-js/ },
							{ name: 'vendor-react', test: /node_modules\/(react|react-dom|scheduler)\// },
							{ name: 'i18n-en', test: /libs\/translations\/src\/languages\/en/ },
							{ name: 'i18n-vi', test: /libs\/translations\/src\/languages\/vi/ },
							{ name: 'i18n-es', test: /libs\/translations\/src\/languages\/es/ },
							{ name: 'i18n-ru', test: /libs\/translations\/src\/languages\/ru/ },
							{ name: 'i18n-tt', test: /libs\/translations\/src\/languages\/tt/ },
							{ name: 'i18n-pt', test: /libs\/translations\/src\/languages\/pt/ },
							{ name: 'i18n-it', test: /libs\/translations\/src\/languages\/it/ },
							{ name: 'i18n-jpn', test: /libs\/translations\/src\/languages\/jpn/ },
							{ name: 'i18n-kr', test: /libs\/translations\/src\/languages\/kr/ },
							{ name: 'i18n-swe', test: /libs\/translations\/src\/languages\/swe/ }
						]
					}
				}
			},
			sourcemap: mode === 'development',
			minify: mode === 'production' ? 'esbuild' : false,
			target: 'esnext',
			chunkSizeWarningLimit: 1000
		}
	};
});
