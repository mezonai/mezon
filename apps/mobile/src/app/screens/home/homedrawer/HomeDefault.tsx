import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_KEY_TEMPORARY_ATTACHMENT, remove } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannel } from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import notifee from '@notifee/react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { setTimeout } from '@testing-library/react-native/build/helpers/timers';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { useSelector } from 'react-redux';
import MezonBottomSheet from '../../../componentUI/MezonBottomSheet';
import AgeRestrictedModal from '../../../components/AgeRestricted/AgeRestrictedModal';
import NotificationSetting from '../../../components/NotificationSetting';
import ShareLocationConfirmModal from '../../../components/ShareLocationConfirmModal';
import ChannelApp from './ChannelApp';
import ChannelMessagesWrapper from './ChannelMessagesWrapper';
import { ChatBox } from './ChatBox';
import DrawerListener from './DrawerListener';
import HomeDefaultHeader from './HomeDefaultHeader';
import PanelKeyboard from './PanelKeyboard';
import { IModeKeyboardPicker } from './components';
import LicenseAgreement from './components/LicenseAgreement';
import { style } from './styles';

const HomeDefault = React.memo((props: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useSelector(selectCurrentChannel);
	const timeoutRef = useRef<any>(null);
	const navigation = useNavigation<any>();
	const panelKeyboardRef = useRef(null);
	const [isReadyForUse, setIsReadyForUse] = useState<boolean>(false);

	const isChannelApp = useMemo(() => {
		return currentChannel?.type === ChannelType.CHANNEL_TYPE_APP;
	}, [currentChannel?.type]);

	useEffect(() => {
		const timer = setTimeout(async () => {
			setIsReadyForUse(true);
			await notifee.cancelAllNotifications();
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
			await BootSplash.hide({ fade: true });
		}, 500);
		return () => {
			clearTimeout(timer);
		};
	}, []);

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	const onOpenDrawer = useCallback(() => {
		requestAnimationFrame(async () => {
			navigation.dispatch(DrawerActions.openDrawer());
			onShowKeyboardBottomSheet(false, 'text');
			Keyboard.dismiss();
		});
	}, [navigation, onShowKeyboardBottomSheet]);

	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const snapPoints = useMemo(() => ['50%'], []);
	const [isShowSettingNotifyBottomSheet, setIsShowSettingNotifyBottomSheet] = useState<boolean>(false);

	const openBottomSheet = () => {
		Keyboard.dismiss();
		setIsShowSettingNotifyBottomSheet(!isShowSettingNotifyBottomSheet);
		timeoutRef.current = setTimeout(() => {
			bottomSheetRef.current?.present();
		}, 200);
	};

	useEffect(() => {
		return () => {
			timeoutRef?.current && clearTimeout(timeoutRef.current);
		};
	}, []);

	return (
		<View style={[styles.homeDefault]}>
			{Platform.OS === 'ios' && <LicenseAgreement />}

			<DrawerListener currentChannel={currentChannel} />
			<HomeDefaultHeader
				openBottomSheet={openBottomSheet}
				navigation={props.navigation}
				currentChannel={currentChannel}
				onOpenDrawer={onOpenDrawer}
			/>
			{isChannelApp && currentChannel ? (
				<ChannelApp channelId={currentChannel?.channel_id} />
			) : currentChannel && isReadyForUse ? (
				<KeyboardAvoidingView style={styles.channelView} behavior={'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 54 : 0}>
					<ChannelMessagesWrapper
						channelId={currentChannel?.channel_id}
						clanId={currentChannel?.clan_id}
						isPublic={isPublicChannel(currentChannel)}
						mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					/>
					<ChatBox
						channelId={currentChannel?.channel_id}
						mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
						onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
					/>
					<PanelKeyboard ref={panelKeyboardRef} currentChannelId={currentChannel?.channel_id} currentClanId={currentChannel?.clan_id} />
					<ShareLocationConfirmModal
						channelId={currentChannel?.channel_id}
						mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					/>
				</KeyboardAvoidingView>
			) : (
				<View />
			)}
			<AgeRestrictedModal />

			<MezonBottomSheet ref={bottomSheetRef} snapPoints={snapPoints}>
				<NotificationSetting />
			</MezonBottomSheet>
		</View>
	);
});

export default HomeDefault;
