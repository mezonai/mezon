import { Fonts, useTheme } from '@mezon/mobile-ui';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Settings } from '../../../screens/settings';
import { AccountSetting } from '../../../screens/settings/AccountSetting';
import { BlockedUsers } from '../../../screens/settings/AccountSetting/BlockedUsers';
import AppearanceSetting from '../../../screens/settings/AppearanceSetting';
import AppThemeSetting from '../../../screens/settings/AppearanceSetting/AppTheme';
import { LanguageSetting } from '../../../screens/settings/LanguageSetting';
import { ProfileSetting } from '../../../screens/settings/ProfileSetting';
import { QRScanner } from '../../../screens/settings/QRScanner';
import { SendCoffeeScreen } from '../../../screens/settings/SendCoffee';
import { Sharing } from '../../../screens/settings/Sharing';
import { APP_SCREEN } from '../../ScreenTypes';

// eslint-disable-next-line no-empty-pattern
export const SettingStacks = ({}: any) => {
	const Stack = createStackNavigator();
	const { t } = useTranslation(['screenStack']);
	const { themeValue } = useTheme();

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: true,
				headerBackTitleVisible: false,
				headerShadowVisible: false,
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				headerTitleAlign: 'center',
				headerTintColor: themeValue.textStrong,
				headerStyle: {
					backgroundColor: themeValue.primary
				},
				headerTitleStyle: {
					fontWeight: 'bold',
					fontSize: Fonts.size.medium
				},
				cardStyle: {
					backgroundColor: 'transparent'
				}
			}}
		>
			<Stack.Screen
				name={APP_SCREEN.SETTINGS.HOME}
				component={Settings}
				options={{
					headerTitle: t('settingStack.settings')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.LANGUAGE}
				component={LanguageSetting}
				options={{
					headerTitle: t('settingStack.language')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.PROFILE}
				component={ProfileSetting}
				options={{
					headerTitle: t('settingStack.profile')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.APPEARANCE}
				component={AppearanceSetting}
				options={{
					headerTitle: t('settingStack.appearance')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.ACCOUNT}
				component={AccountSetting}
				options={{
					headerTitle: t('settingStack.account')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.BLOCKED_USERS}
				component={BlockedUsers}
				options={{
					headerTitle: t('settingStack.blockedUsers')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.APP_THEME}
				component={AppThemeSetting}
				options={{
					headerTitle: t('settingStack.appTheme'),
					gestureEnabled: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.SHARING}
				component={Sharing}
				options={{
					headerShown: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.QR_SCANNER}
				component={QRScanner}
				options={{
					headerShown: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.SETTINGS.SEND_COFFEE}
				component={SendCoffeeScreen}
				options={{
					headerTitle: 'Send token',
					gestureEnabled: false,
					headerStyle: {
						backgroundColor: themeValue.secondary
					}
				}}
			/>
		</Stack.Navigator>
	);
};
