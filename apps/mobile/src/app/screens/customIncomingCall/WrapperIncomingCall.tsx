import { ChatContextProvider } from '@mezon/core';
import { MezonStoreProvider, initStore } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { useMemo } from 'react';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../configs/toastConfig';
import IncomingHomeScreen from './IncomingHomeScreen';

export default function WrapperIncomingCall(props: any) {
	const mezon = useMezon();
	const { store, persistor } = useMemo(() => {
		if (!mezon) {
			return { store: null, persistor: null };
		}
		return initStore(mezon, undefined);
	}, [mezon]);

	return (
		<MezonStoreProvider store={store} loading={null} persistor={persistor}>
			<StatusBar backgroundColor="#09090C" barStyle="light-content" />
			<ChatContextProvider>
				<NavigationContainer>
					<IncomingHomeScreen {...props} />
				</NavigationContainer>
			</ChatContextProvider>
			<Toast config={toastConfig} />
		</MezonStoreProvider>
	);
}
