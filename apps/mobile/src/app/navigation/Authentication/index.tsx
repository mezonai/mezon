import React, { memo } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Dimensions, Platform } from 'react-native';
import CallingModalWrapper from '../../components/CallingModalWrapper';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import ChannelVoicePopup from '../../screens/home/homedrawer/components/ChannelVoicePopup';
import StreamingWrapper from '../../screens/home/homedrawer/components/StreamingWrapper';
import HomeDefaultWrapper from '../../screens/home/homedrawer/HomeDefaultWrapper';
import HomeScreen from '../../screens/home/HomeScreen';
import { DirectMessageDetailScreen } from '../../screens/messages/DirectMessageDetail';
import { APP_SCREEN } from '../ScreenTypes';
import BottomNavigatorWrapper from './BottomNavigatorWrapper';
import { FriendStacks } from './stacks/FriendStacks';
import { MenuChannelStacks } from './stacks/MenuChannelStack';
import { MenuClanStacks } from './stacks/MenuSererStack';
import { MenuThreadDetailStacks } from './stacks/MenuThreadDetailStacks';
import { MessagesStacks } from './stacks/MessagesStacks';
import { NotificationStacks } from './stacks/NotificationStacks';
import { ServersStacks } from './stacks/ServersStacks';
import { SettingStacks } from './stacks/SettingStacks';
const RootStack = createStackNavigator();

export const Authentication = memo(() => {
	const isTabletLandscape = useTabletLandscape();

	return (
		<BottomSheetModalProvider>
			<RootStack.Navigator
				initialRouteName={APP_SCREEN.BOTTOM_BAR}
				screenOptions={{
					headerShown: false,
					gestureEnabled: Platform.OS === 'ios',
					gestureDirection: 'horizontal',
					...TransitionPresets.ModalFadeTransition,
					animationEnabled: false
				}}
			>
				<RootStack.Screen name={APP_SCREEN.BOTTOM_BAR} component={BottomNavigatorWrapper} />
				<RootStack.Screen
					name={APP_SCREEN.HOME_DEFAULT}
					component={isTabletLandscape ? HomeScreen : HomeDefaultWrapper}
					options={{
						animationEnabled: false,
						headerShown: false,
						gestureEnabled: Platform.OS === 'ios',
						gestureDirection: 'horizontal',
						gestureResponseDistance: Dimensions.get('window').width
					}}
				/>
				<RootStack.Screen
					name={APP_SCREEN.MESSAGES.MESSAGE_DETAIL}
					component={DirectMessageDetailScreen}
					options={{
						animationEnabled: false,
						headerShown: false,
						headerShadowVisible: false,
						gestureEnabled: Platform.OS === 'ios',
						gestureDirection: 'horizontal',
						gestureResponseDistance: Dimensions.get('window').width
					}}
				/>
				<RootStack.Screen name={APP_SCREEN.SERVERS.STACK} children={(props) => <ServersStacks {...props} />} />
				<RootStack.Screen name={APP_SCREEN.MESSAGES.STACK} children={(props) => <MessagesStacks {...props} />} />
				<RootStack.Screen name={APP_SCREEN.NOTIFICATION.STACK} children={(props) => <NotificationStacks {...props} />} />
				<RootStack.Screen name={APP_SCREEN.MENU_CHANNEL.STACK} children={(props) => <MenuChannelStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.MENU_THREAD.STACK} children={(props) => <MenuThreadDetailStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.MENU_CLAN.STACK} children={(props) => <MenuClanStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.SETTINGS.STACK} children={(props) => <SettingStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.FRIENDS.STACK} children={(props) => <FriendStacks {...props} />} />
			</RootStack.Navigator>
			<CallingModalWrapper />
			<StreamingWrapper />
			<ChannelVoicePopup />
		</BottomSheetModalProvider>
	);
});
