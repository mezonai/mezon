import { useEffect, useState } from 'react';

// check performance
export const useWindowFocusState = () => {
	const [isFocusDesktop, setIsFocusDesktop] = useState(true);
	const [isTabVisible, setIsTabVisible] = useState(true);

	useEffect(() => {
		const handleTabBrowserFocus = () => {
			setIsTabVisible(true);
		};

		const handleTabBrowserBlur = () => {
			setIsTabVisible(false);
		};

		if (window?.electron) {
			const handleWindowFocused = () => {
				setIsFocusDesktop(true);
			};

			const handleWindowBlurred = () => {
				setIsFocusDesktop(false);
			};

			window.electron.onWindowBlurred(handleWindowBlurred);
			window.electron.onWindowFocused(handleWindowFocused);

			return () => {
				window.electron.removeListener('window-blurred', handleWindowBlurred);
				window.electron.removeListener('window-focused', handleWindowFocused);
			};
		}
		window.addEventListener('focus', handleTabBrowserFocus);
		window.addEventListener('blur', handleTabBrowserBlur);

		return () => {
			window.removeEventListener('focus', handleTabBrowserFocus);
			window.removeEventListener('blur', handleTabBrowserBlur);
		};
	}, []);

	return { isFocusDesktop, isTabVisible };
};
