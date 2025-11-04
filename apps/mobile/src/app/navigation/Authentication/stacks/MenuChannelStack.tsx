import { Fonts, size, useTheme } from '@mezon/mobile-ui';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { CanvasScreen } from '../../../components/Canvas/CanvasBoard';
import { ChangeCategory } from '../../../components/ChangeCategory';
import { ChannelSetting } from '../../../components/ChannelSetting';
import StreamBannerScreen from '../../../components/StreamBanner';
import SearchMessageChannel from '../../../components/ThreadDetail/SearchMessageChannel';
import SearchMessageDm from '../../../components/ThreadDetail/SearchMessageDm/SearchMessageDm';
import { ChannelPermissionSetting } from '../../../screens/channelPermissionSetting';
import { AdvancedPermissionOverrides } from '../../../screens/channelPermissionSetting/AdvancedPermissionOverrides';
import { QuickAction } from '../../../screens/channelPermissionSetting/QuickAction';
import { APP_SCREEN } from '../../ScreenTypes';

// eslint-disable-next-line no-empty-pattern
export function MenuChannelStacks({}: any) {
	const { themeValue } = useTheme();
	const Stack = createStackNavigator();
	const { t } = useTranslation(['screenStack']);

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: true,
				headerShadowVisible: false,
				gestureEnabled: Platform.OS === 'ios',
				gestureDirection: 'horizontal',
				headerTitleAlign: 'center',
				headerTintColor: themeValue.text,
				headerStyle: {
					backgroundColor: themeValue.primary
				},
				headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
				headerTitleStyle: {
					fontSize: Fonts.size.h6,
					fontWeight: 'bold'
				},
				headerLeftContainerStyle: Platform.select({
					ios: {
						left: size.s_6
					}
				}),
				cardStyle: {
					backgroundColor: 'transparent'
				},
				animationEnabled: Platform.OS === 'ios'
			}}
		>
			<Stack.Screen
				name={APP_SCREEN.MENU_CHANNEL.SETTINGS}
				component={ChannelSetting}
				options={{
					headerTitle: t('menuChannelStack.channelSetting'),
					headerStyle: {
						backgroundColor: themeValue.primary
					},
					headerTitleStyle: {
						color: themeValue.textStrong
					},
					headerLeftLabelVisible: false
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL}
				component={SearchMessageChannel}
				options={{
					headerShown: false,
					headerLeftLabelVisible: false
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_DM}
				component={SearchMessageDm}
				options={{
					headerShown: false,
					headerLeftLabelVisible: false
				}}
			/>
			<Stack.Screen name={APP_SCREEN.MENU_CHANNEL.CHANNEL_PERMISSION} component={ChannelPermissionSetting} />
			<Stack.Screen
				name={APP_SCREEN.MENU_CHANNEL.QUICK_ACTION}
				options={{
					headerLeftLabelVisible: false
				}}
				component={QuickAction}
			/>
			<Stack.Screen name={APP_SCREEN.MENU_CHANNEL.CHANGE_CATEGORY} component={ChangeCategory} />
			<Stack.Screen name={APP_SCREEN.MENU_CHANNEL.ADVANCED_PERMISSION_OVERRIDES} component={AdvancedPermissionOverrides} />
			<Stack.Screen
				name={APP_SCREEN.MENU_CHANNEL.CANVAS}
				component={CanvasScreen}
				options={{
					headerTitle: '',
					headerStyle: {
						backgroundColor: themeValue?.primaryGradiant || themeValue.charcoal
					},
					headerTintColor: themeValue.white,
					headerLeftLabelVisible: false
				}}
			/>
			<Stack.Screen name={APP_SCREEN.MENU_CHANNEL.STREAM_BANNER} component={StreamBannerScreen} options={{ headerShown: false }} />
		</Stack.Navigator>
	);
}
