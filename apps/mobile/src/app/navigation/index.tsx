import i18n from '@mezon/translations';
import { CreateMezonClientOptions, MezonContextProvider, MmnContextProvider } from '@mezon/transport';
import * as Sentry from '@sentry/react-native';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
// import codePush from 'react-native-code-push';
import { load, STORAGE_SESSION_KEY } from '@mezon/mobile-components';
import RootNavigation from './RootNavigator';
const reactNavigationIntegration = Sentry.reactNavigationIntegration();

Sentry.init({
	dsn: process.env.NX_MOBILE_SENTRY_DSN,
	tracesSampleRate: 1.0,
	enabled: !__DEV__,
	integrations: [reactNavigationIntegration]
});

const getMezonConfig = (): CreateMezonClientOptions => {
	try {
		const storedConfig = load(STORAGE_SESSION_KEY);
		if (storedConfig) {
			const parsedConfig = JSON.parse(storedConfig);
			if (parsedConfig.host && parsedConfig.port) {
				parsedConfig.key = process.env.NX_CHAT_APP_API_KEY as string;
				return parsedConfig;
			}
		}
	} catch (error) {
		console.error('Failed to get Mezon config from localStorage:', error);
	}

	return {
		host: process.env.NX_CHAT_APP_API_GW_HOST as string,
		port: process.env.NX_CHAT_APP_API_GW_PORT as string,
		key: process.env.NX_CHAT_APP_API_KEY as string,
		ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
	};
};

const mezon = getMezonConfig();

const App = (props) => {
	return (
		<I18nextProvider i18n={i18n}>
			<MezonContextProvider mezon={mezon} connect={true} isFromMobile={true}>
				<MmnContextProvider>
					<RootNavigation {...props} />
				</MmnContextProvider>
			</MezonContextProvider>
		</I18nextProvider>
	);
};

export default App;
