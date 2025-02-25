import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { STORAGE_IS_LAST_ACTIVE_TAB_DM, save } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { setTimeout } from '@testing-library/react-native/build/helpers/timers';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
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
// HomeDefault check
const HomeDefault = React.memo((props: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const channelId = props?.channelId;
	const clanId = props?.clanId;
	const isPublicChannel = props?.isPublicChannel;
	const isThread = props?.isThread;
	const channelType = props?.channelType;
	const timeoutRef = useRef<any>(null);
	const navigation = useNavigation<any>();
	const panelKeyboardRef = useRef(null);

	const isChannelApp = useMemo(() => {
		return channelType === ChannelType.CHANNEL_TYPE_APP;
	}, [channelType]);

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	const onOpenDrawer = useCallback(() => {
		requestAnimationFrame(async () => {
			navigation.goBack();
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
		save(STORAGE_IS_LAST_ACTIVE_TAB_DM, 'false');
		return () => {
			timeoutRef?.current && clearTimeout(timeoutRef.current);
		};
	}, []);

	return (
		<View style={[styles.homeDefault]}>
			{Platform.OS === 'ios' && <LicenseAgreement />}

			<DrawerListener />
			<HomeDefaultHeader openBottomSheet={openBottomSheet} navigation={props.navigation} onOpenDrawer={onOpenDrawer} />
			{isChannelApp ? (
				<ChannelApp channelId={channelId} />
			) : (
				<KeyboardAvoidingView style={styles.channelView} behavior={'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 54 : 0}>
					<ChannelMessagesWrapper
						channelId={channelId}
						clanId={clanId}
						isPublic={isPublicChannel}
						mode={isThread ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					/>
					<ChatBox
						channelId={channelId}
						mode={isThread ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
						onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
						hiddenIcon={{
							threadIcon: channelType === ChannelType.CHANNEL_TYPE_THREAD
						}}
						isPublic={isPublicChannel}
					/>
					<PanelKeyboard ref={panelKeyboardRef} currentChannelId={channelId} currentClanId={clanId} />
					<ShareLocationConfirmModal
						channelId={channelId}
						mode={isThread ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					/>
				</KeyboardAvoidingView>
			)}
			<AgeRestrictedModal />
			<MezonBottomSheet ref={bottomSheetRef} snapPoints={snapPoints}>
				<NotificationSetting />
			</MezonBottomSheet>
		</View>
	);
});

export default HomeDefault;
