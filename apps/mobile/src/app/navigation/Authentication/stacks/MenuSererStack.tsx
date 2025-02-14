import { Fonts, size, useTheme } from '@mezon/mobile-ui';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import AuditLogComponent from '../../../components/AuditLogComponent';
import FilterActionAuditLog from '../../../components/AuditLogComponent/FilteActionAuditLog/FilterActionAuditLog';
import FilterUserAuditLog from '../../../components/AuditLogComponent/FilterUserAuditLog/FilterUserAuditLog';
import { CategoryCreator } from '../../../components/Category';
import { CategorySetting } from '../../../components/CategorySetting';
import { ChannelCreator } from '../../../components/ChannelCreator';
import { ClanNotificationSetting } from '../../../components/ClanNotificationSetting';
import { NotificationOverrides } from '../../../components/ClanNotificationSetting/NotificationOverrides';
import { ClanNotificationSetting as NotificationSettingDetail } from '../../../components/ClanNotificationSetting/NotificationSettingDetail';
import { ClanSetting } from '../../../components/ClanSettings';
import { ClanEmojiSetting } from '../../../components/ClanSettings/Emoji';
import { Integrations } from '../../../components/ClanSettings/Integrations';
import { Webhooks } from '../../../components/ClanSettings/Integrations/Webhooks';
import { WebhooksEdit } from '../../../components/ClanSettings/Integrations/Webhooks/WebhooksEdit';
import { MemberSetting } from '../../../components/ClanSettings/Member';
import { ClanOverviewSetting } from '../../../components/ClanSettings/Overview';
import { StickerSetting } from '../../../components/ClanSettings/Sticker';
import { EventCreatorDetails } from '../../../components/EventCreator/EventCreatorDetails';
import { EventCreatorPreview } from '../../../components/EventCreator/EventCreatorPreview';
import { EventCreatorType } from '../../../components/EventCreator/EventCreatorType';
import { CreateNewRole } from '../../../screens/serverRoles/CreateNewRole';
import { RoleDetail } from '../../../screens/serverRoles/RoleDetail';
import { ServerRoles } from '../../../screens/serverRoles/ServerRoles';
import { SetupMembers } from '../../../screens/serverRoles/SetupMembers';
import { SetupPermissions } from '../../../screens/serverRoles/SetupPermissions';
import { APP_SCREEN } from '../../ScreenTypes';

// eslint-disable-next-line no-empty-pattern
export const MenuClanStacks = ({}: any) => {
	const { themeValue } = useTheme();
	const Stack = createStackNavigator();
	const { t } = useTranslation(['screenStack']);

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: true,
				headerShadowVisible: false,
				headerBackTitleVisible: false,
				gestureEnabled: Platform.OS === 'ios',
				gestureDirection: 'horizontal',
				headerTitleAlign: 'center',
				headerTintColor: themeValue.white,
				headerStyle: {
					backgroundColor: themeValue.secondary
				},
				headerTitleStyle: {
					fontSize: Fonts.size.label,
					fontWeight: 'bold',
					color: themeValue.textStrong
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
				name={APP_SCREEN.MENU_CLAN.CREATE_CATEGORY}
				component={CategoryCreator}
				options={{
					headerTitle: t('menuClanStack.categoryCreator')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.CREATE_CHANNEL}
				component={ChannelCreator}
				options={{
					headerTitle: t('menuClanStack.channelCreator')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.CREATE_EVENT}
				component={EventCreatorType}
				options={{
					headerTitle: t('menuClanStack.eventCreator'),
					headerLeftLabelVisible: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.CREATE_EVENT_DETAILS}
				component={EventCreatorDetails}
				options={{
					headerTitle: t('menuClanStack.eventCreator'),
					headerLeftLabelVisible: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.CREATE_EVENT_PREVIEW}
				component={EventCreatorPreview}
				options={{
					headerTitle: t('menuClanStack.eventCreator'),
					headerLeftLabelVisible: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.SETTINGS}
				component={ClanSetting}
				options={{
					headerTitle: t('menuClanStack.clanSetting')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.OVERVIEW_SETTING}
				component={ClanOverviewSetting}
				options={{
					headerTitle: t('menuClanStack.clanOverviewSetting')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.EMOJI_SETTING}
				component={ClanEmojiSetting}
				options={{
					headerTitle: t('menuClanStack.clanEmojiSetting')
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.STICKER_SETTING}
				component={StickerSetting}
				options={{
					headerTitle: t('menuClanStack.sticker')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.MEMBER_SETTING}
				component={MemberSetting}
				options={{
					headerTitle: t('menuClanStack.member')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.ROLE_SETTING}
				component={ServerRoles}
				options={{
					headerTitle: t('menuClanStack.serverRoles')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.CREATE_NEW_ROLE}
				component={CreateNewRole}
				options={{
					headerLeftLabelVisible: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.CATEGORY_SETTING}
				component={CategorySetting}
				options={{
					headerTitle: t('menuClanStack.categorySetting')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS}
				component={SetupPermissions}
				options={{
					headerLeftLabelVisible: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS}
				component={SetupMembers}
				options={{
					headerLeftLabelVisible: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.ROLE_DETAIL}
				component={RoleDetail}
				options={{
					headerLeftLabelVisible: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING}
				component={ClanNotificationSetting}
				options={{
					headerTitle: t('menuClanStack.notificationSetting')
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.NOTIFICATION_OVERRIDES}
				component={NotificationOverrides}
				options={{
					headerTitle: t('menuClanStack.newOverride')
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING_DETAIL}
				component={NotificationSettingDetail}
				options={{
					headerTitle: t('menuClanStack.notificationSetting')
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.INTEGRATIONS}
				component={Integrations}
				options={{
					headerTitle: t('menuClanStack.integrations')
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.WEBHOOKS}
				component={Webhooks}
				options={{
					headerTitle: t('menuClanStack.webhooks'),
					headerLeftLabelVisible: false
				}}
			/>
			<Stack.Screen name={APP_SCREEN.MENU_CLAN.AUDIT_LOG} component={AuditLogComponent} />
			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.FILTER_BY_USER}
				component={FilterUserAuditLog}
				options={{
					headerTitle: t('menuClanStack.filterByUser'),
					headerLeftLabelVisible: false
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MENU_CLAN.FILTER_BY_ACTION}
				component={FilterActionAuditLog}
				options={{
					headerTitle: t('menuClanStack.filterByAction'),
					headerLeftLabelVisible: false
				}}
			/>
			<Stack.Screen name={APP_SCREEN.MENU_CLAN.WEBHOOKS_EDIT} component={WebhooksEdit} />
		</Stack.Navigator>
	);
};
