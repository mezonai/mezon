import { Suspense, lazy } from 'react';

export const createLazyIconWithFallback = (importFn: () => Promise<any>, exportName: string, fallback: React.ReactNode = null) => {
	const LazyComponent = lazy(() =>
		importFn().then((module) => {
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
