import { selectAppChannelById, selectTheme, useAppSelector } from '@mezon/store';
import { extractAndSaveConfig, useMezon } from '@mezon/transport';
import { ApiChannelAppResponseExtend } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { ChannelApps } from '../pages/channel/ChannelApp';

const ChannelAppLayoutMobile = () => {
	const { channelId } = useParams();
	const location = useLocation();
	const channelApp = useAppSelector((state) => selectAppChannelById(state, channelId || ''));

	const { clientRef } = useMezon();

	useEffect(() => {
		// Helper function to set client configuration
		const configureClient = (config: any) => {
			if (clientRef?.current && config) {
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

	let appChannelToresolve: ApiChannelAppResponseExtend = channelApp;
	if (location?.search) {
		const query = new URLSearchParams(location?.search);
		const code = query.get('code');
		const subpath = query.get('subpath');
		appChannelToresolve = {
			...channelApp,
			code: code as string,
			subpath: subpath as string
		};
	}

	const appearanceTheme = useSelector(selectTheme);
	return (
		<div className={`flex flex-1 justify-center overflow-y-auto overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}>
			<ChannelApps appChannel={appChannelToresolve} />
		</div>
	);
};

export default ChannelAppLayoutMobile;
