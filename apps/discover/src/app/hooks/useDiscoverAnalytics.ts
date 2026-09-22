import { useEffect } from 'react';

const GA_ID = 'G-9SD8R7Z8TJ';

export function useDiscoverAnalytics() {
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const win = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
		if (typeof win.gtag === 'function') return;

		const externalScript = document.createElement('script');
		externalScript.async = true;
		externalScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
		document.head.appendChild(externalScript);

		win.dataLayer = win.dataLayer || [];
		win.gtag = function gtag(...args: unknown[]) {
			win.dataLayer?.push(args);
		};
		win.gtag('js', new Date());
		win.gtag('config', GA_ID);
	}, []);
}
