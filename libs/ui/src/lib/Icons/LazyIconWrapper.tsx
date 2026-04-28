import { Suspense, lazy } from 'react';

const RELOAD_KEY = '__chunk_reload__';

function loadWithReloadOnChunkError(importFn: () => Promise<any>): Promise<any> {
	return importFn().catch((err: unknown) => {
		const isChunkError =
			err instanceof Error &&
			(err.message.includes('Failed to fetch dynamically imported module') ||
				err.message.includes('Importing a module script failed') ||
				err.name === 'ChunkLoadError');
		if (isChunkError && !sessionStorage.getItem(RELOAD_KEY)) {
			sessionStorage.setItem(RELOAD_KEY, '1');
			window.location.reload();
		}
		return { default: () => null };
	});
}

export const createLazyIconWithFallback = (importFn: () => Promise<any>, exportName: string, fallback: React.ReactNode = null) => {
	const LazyComponent = lazy(() =>
		loadWithReloadOnChunkError(importFn).then((module) => {
			const component = module[exportName] ?? module?.default?.[exportName];
			if (!component) {
				return { default: () => null };
			}
			return { default: component };
		})
	);

	return (props: any) => (
		<Suspense fallback={fallback}>
			<LazyComponent {...props} />
		</Suspense>
	);
};
