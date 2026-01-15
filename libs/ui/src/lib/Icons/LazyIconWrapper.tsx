import { Suspense, lazy } from 'react';

export const createLazyIconWithFallback = (importFn: () => Promise<any>, exportName: string, fallback: React.ReactNode = null) => {
	const LazyComponent = lazy(() =>
		importFn().then((module) => ({
			default: module[exportName]
		}))
	);

	return (props: any) => (
		<Suspense fallback={fallback}>
			<LazyComponent {...props} />
		</Suspense>
	);
};
