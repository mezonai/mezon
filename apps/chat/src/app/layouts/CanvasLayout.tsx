import { Canvas } from '@mezon/components';
import { selectTheme } from '@mezon/store';
import { extractAndSaveConfig, useMezon } from '@mezon/transport';
import { safeJSONParse } from 'mezon-js';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const CanvasLayout = () => {
	const appearanceTheme = useSelector(selectTheme);
	const { clientRef } = useMezon();

	useEffect(() => {
		// Helper function to set client configuration
		const configureClient = (config: any) => {
			if (clientRef?.current && config) {
				console.log(config, 'config CanvasLayout');
				clientRef.current.setBasePath(config.host, config.port, config.useSSL);
			}
		};

		// Try to get configuration from primary source
		const storedConfig = localStorage.getItem('mezon_session');
		if (storedConfig) {
			const config = safeJSONParse(storedConfig);
			configureClient(config);
			return;
		}

		// Fall back to extracting config from auth data if primary source not available
		const authData = localStorage.getItem('persist:auth');
		if (authData) {
			const authDataParse = safeJSONParse(authData);
			if (authDataParse?.session) {
				const sessionData = safeJSONParse(authDataParse.session);
				const config = extractAndSaveConfig(sessionData);
				configureClient(config);
			}
		}
	}, []);

	return (
		<div className={`flex flex-1 justify-center thread-scroll ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}>
			<Canvas />
		</div>
	);
};

export default CanvasLayout;
