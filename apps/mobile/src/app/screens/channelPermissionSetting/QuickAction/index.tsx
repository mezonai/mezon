import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme, verticalScale } from '@mezon/mobile-ui';
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
import { QUICK_MENU_TYPE, QuickMenuType } from '@mezon/utils';
import { ApiQuickMenuAccess } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import LoadingModal from '../../../components/LoadingModal/LoadingModal';
import { QuickActionList } from '../../../components/QuickAction/QuickActionList';
import { IconCDN } from '../../../constants/icon_cdn';
import ModalQuickMenu from './ModalQuickMenu';
import { style } from './quickAction.style';

const TabButton = React.memo(
	({
		tab,
		selectedTab,
		onPress,
		styles
	}: {
		tab: { title: string; type: QuickMenuType };
		selectedTab: QuickMenuType;
		onPress: (type: QuickMenuType) => void;
		styles: any;
	}) => {
		const isActive = selectedTab === tab.type;

		return (
			<Pressable onPress={() => onPress(tab.type)} style={[styles.tab, isActive && styles.activeTab]}>
				<Text style={[styles.tabTitle, isActive && styles.activeTabTitle]}>{tab.title}</Text>
			</Pressable>
		);
	}
);

const HeaderTitle = React.memo(({ title, themeValue }: { title: string; themeValue: any }) => (
	<View>
		<Text style={{ fontSize: verticalScale(18), marginLeft: 0, marginRight: 0, color: themeValue.white }}>{title}</Text>
	</View>
));

const AddButton = React.memo(({ onPress, themeValue }: { onPress: () => void; themeValue: any }) => (
	<TouchableOpacity style={style(themeValue).addButton} onPress={onPress}>
		<MezonIconCDN icon={IconCDN.addAction} height={size.s_40} width={size.s_40} color={themeValue.textStrong} />
	</TouchableOpacity>
));

export function QuickAction({ navigation, route }) {
	const { channelId } = route.params;
	const [selectedTab, setSelectedTab] = useState<QuickMenuType>(QUICK_MENU_TYPE.FLASH_MESSAGE);
	const { t } = useTranslation('channelSetting');

	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();

	const flashMessages = useAppSelector((state) => selectFlashMessagesByChannelId(state as any, channelId));
	const quickMenus = useAppSelector((state) => selectQuickMenusByChannelId(state as any, channelId));
	const channel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const isLoading = useAppSelector((state) => selectQuickMenuLoadingStatus(state as any));

	const listQuickActions = useMemo(
		() => (selectedTab === QUICK_MENU_TYPE.FLASH_MESSAGE ? flashMessages : quickMenus),
		[selectedTab, flashMessages, quickMenus]
	);

	const clanId = useMemo(() => channel?.clan_id, [channel?.clan_id]);
	const styles = useMemo(() => style(themeValue), [themeValue]);

	const quickActionTabs = useMemo(
		() => [
			{ title: t('quickAction.flashMessage'), type: QUICK_MENU_TYPE.FLASH_MESSAGE },
			{ title: t('quickAction.quickMenu'), type: QUICK_MENU_TYPE.QUICK_MENU }
		],
		[t]
	);

	const headerTitle = useMemo(() => t('quickAction.title'), [t]);

	useEffect(() => {
		dispatch(listQuickMenuAccess({ channelId: channelId, menuType: selectedTab }));
	}, [channelId, dispatch, selectedTab]);

	const openModal = useCallback(
		(item: ApiQuickMenuAccess | null = null) => {
			const data = {
				children: (
					<ModalQuickMenu
						initialFormKey={item?.menu_name || ''}
						initialFormValue={item?.action_msg || ''}
						editKey={item?.id}
						channelId={channelId}
						clanId={clanId}
						menuType={selectedTab}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[channelId, clanId, selectedTab]
	);

	const deleteItem = useCallback(
		async (id: string) => {
			try {
				await dispatch(deleteQuickMenuAccess({ id, channelId }));
				await dispatch(listQuickMenuAccess({ channelId, menuType: selectedTab }));
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			} catch (error) {
				console.error(error.message);
			}
		},
		[dispatch, channelId, selectedTab]
	);

	const handlePressDeleteCategory = useCallback(
		(id: string, item: any) => {
			const data = {
				children: (
					<MezonConfirm
						onConfirm={() => deleteItem(id)}
						title={t('quickAction.deleteModal')}
						confirmText={t('confirm.delete.confirmText')}
						content={t('quickAction.deleteTitle', {
							key: item.menu_name
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

	const handleAddPress = useCallback(() => {
		openModal(null);
	}, [openModal]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: () => <HeaderTitle title={headerTitle} themeValue={themeValue} />
		});
	}, [navigation, headerTitle, themeValue]);

	return (
		<View style={{ flex: 1, backgroundColor: themeValue.primary, paddingHorizontal: size.s_12 }}>
			<View style={styles.toggleWrapper}>
				{quickActionTabs.map((tab) => (
					<TabButton key={tab.type} tab={tab} selectedTab={selectedTab} onPress={handleTabPress} styles={styles} />
				))}
			</View>
			{isLoading === 'loading' ? (
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<LoadingModal isVisible={true} />
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
			<AddButton onPress={handleAddPress} themeValue={themeValue} />
		</View>
	);
}
