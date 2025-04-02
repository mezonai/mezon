import { useEffect, useState } from 'react';

export function useIdleRender() {
	const [shouldRender, setShouldRender] = useState(false);

	useEffect(() => {
		const handle = window.requestIdleCallback(() => {
			setShouldRender(true);
		});

		return () => window.cancelIdleCallback(handle);
	}, []);

	return shouldRender;
}
