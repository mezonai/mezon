import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	deleteQuickMenuAccess,
	listQuickMenuAccess,
	selectChannelById,
	selectFlashMessagesByChannelId,
	selectQuickMenuLoadingStatus,
	selectQuickMenusByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { QuickMenuType } from '@mezon/utils';
import { QUICK_MENU_TYPE } from '@mezon/utils';
import type { ApiQuickMenuAccess } from 'mezon-js/api.gen';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import LoadingModal from '../../../components/LoadingModal/LoadingModal';
import { QuickActionList } from '../../../components/QuickAction/QuickActionList';
import { IconCDN } from '../../../constants/icon_cdn';
import ModalQuickMenu from './ModalQuickMenu';
import { style } from './quickAction.style';

export function QuickAction({ navigation, route }) {
	const { channelId } = route.params;
	const [selectedTab, setSelectedTab] = useState<QuickMenuType>(QUICK_MENU_TYPE.FLASH_MESSAGE);
	const { t } = useTranslation('channelSetting');

	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const flashMessages = useAppSelector((state) => selectFlashMessagesByChannelId(state as any, channelId));
	const quickMenus = useAppSelector((state) => selectQuickMenusByChannelId(state as any, channelId));
	const channel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const isLoading = useAppSelector((state) => selectQuickMenuLoadingStatus(state as any));

	const listQuickActions = useMemo(
		() => (selectedTab === QUICK_MENU_TYPE.FLASH_MESSAGE ? flashMessages : quickMenus),
		[selectedTab, flashMessages, quickMenus]
	);

	const quickActionTabs = useMemo(
		() => [
			{ title: t('quickAction.flashMessage'), type: QUICK_MENU_TYPE.FLASH_MESSAGE },
			{ title: t('quickAction.quickMenu'), type: QUICK_MENU_TYPE.QUICK_MENU }
		],
		[t]
	);

	useEffect(() => {
		dispatch(listQuickMenuAccess({ channelId, menuType: selectedTab }));
	}, [channelId, selectedTab]);

	const openModal = useCallback(
		(item: ApiQuickMenuAccess | null = null) => {
			const data = {
				children: (
					<ModalQuickMenu
						initialFormKey={item?.menu_name || ''}
						initialFormValue={item?.action_msg || ''}
						editKey={item?.id}
						channelId={channelId}
						clanId={channel?.clan_id}
						menuType={selectedTab}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[channelId, channel?.clan_id, selectedTab]
	);

	const deleteItem = useCallback(
		async (id: string) => {
			try {
				await dispatch(deleteQuickMenuAccess({ id, channelId, clanId: channel?.clan_id }));
				await dispatch(listQuickMenuAccess({ channelId, menuType: selectedTab }));
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			} catch (error) {
				console.error('Error deleting quick menu item:', error);
			}
		},
		[channelId, selectedTab, channel?.clan_id]
	);

	const handlePressDeleteCategory = useCallback(
		(id: string, item: ApiQuickMenuAccess) => {
			const data = {
				children: (
					<MezonConfirm
						onConfirm={() => deleteItem(id)}
						title={t('quickAction.deleteModal')}
						confirmText={t('confirm.delete.confirmText')}
						content={t('quickAction.deleteTitle', {
							command: item.menu_name
						})}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[deleteItem, t]
	);

	const handleTabPress = useCallback((type: QuickMenuType) => {
		setSelectedTab(type);
	}, []);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: () => (
				<View>
					<Text style={styles.headerTitleText}>{t('quickAction.title')}</Text>
				</View>
			)
		});
	}, [navigation, t]);

	return (
		<View style={styles.containerView}>
			<View style={styles.toggleWrapper}>
				{quickActionTabs.map((tab) => (
					<Pressable onPress={() => handleTabPress(tab.type)} style={[styles.tab, selectedTab === tab.type && styles.activeTab]}>
						<Text style={[styles.tabTitle, selectedTab === tab.type && styles.activeTabTitle]}>{tab.title}</Text>
					</Pressable>
				))}
			</View>
			{isLoading === 'loading' ? (
				<View style={styles.loadingView}>
					<LoadingModal isVisible={true} isTransparent />
				</View>
			) : (
				<QuickActionList
					data={listQuickActions}
					themeValue={themeValue}
					openModal={openModal}
					handleDelete={handlePressDeleteCategory}
					selectedTab={selectedTab}
				/>
			)}
			<TouchableOpacity style={styles.addButton} onPress={() => openModal(null)}>
				<MezonIconCDN icon={IconCDN.addAction} height={size.s_40} width={size.s_40} color={themeValue.textStrong} />
			</TouchableOpacity>
		</View>
	);
}
