import { ActionEmitEvent, STORAGE_IS_LAST_ACTIVE_TAB_DM, save } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { setTimeout } from '@testing-library/react-native/build/helpers/timers';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Keyboard, Platform, StatusBar, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import AgeRestrictedModal from '../../../components/AgeRestricted/AgeRestrictedModal';
import NotificationSetting from '../../../components/NotificationSetting';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import ChannelAppHotbar from './ChannelAppHotbar';
import ChannelMessages from './ChannelMessages';
import { ChatBox } from './ChatBox';
import DrawerListener from './DrawerListener';
import HomeDefaultHeader from './HomeDefaultHeader';
import PanelKeyboard from './PanelKeyboard';
import LicenseAgreement from './components/LicenseAgreement';
import { style } from './styles';
// HomeDefault check
const HomeDefault = React.memo(
	(props: any) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const channelId = props?.channelId;
		const clanId = props?.clanId;
		const isPublicChannel = props?.isPublicChannel;
		const isThread = props?.isThread;
		const channelType = props?.channelType;
		const timeoutRef = useRef<any>(null);
		const navigation = useNavigation<any>();

		const isChannelApp = channelType === ChannelType.CHANNEL_TYPE_APP;

		const onOpenDrawer = useCallback(() => {
			requestAnimationFrame(async () => {
				navigation.navigate(APP_SCREEN.BOTTOM_BAR);
				Keyboard.dismiss();
			});
		}, [navigation]);

		const [isShowSettingNotifyBottomSheet, setIsShowSettingNotifyBottomSheet] = useState<boolean>(false);

		const openBottomSheet = useCallback(() => {
			Keyboard.dismiss();
			setIsShowSettingNotifyBottomSheet(!isShowSettingNotifyBottomSheet);

			const data = {
				heightFitContent: true,
				children: <NotificationSetting />
			};

			if (Platform.OS === 'ios') {
				timeoutRef.current = setTimeout(() => {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
				}, 200);
			} else {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			}
		}, []);

		useEffect(() => {
			save(STORAGE_IS_LAST_ACTIVE_TAB_DM, 'false');
			return () => {
				timeoutRef?.current && clearTimeout(timeoutRef.current);
			};
		}, []);

		return (
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={styles.channelView}
			>
				<KeyboardAvoidingView
					style={styles.channelView}
					behavior={'padding'}
					keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
				>
					{Platform.OS === 'ios' && <LicenseAgreement />}
					<DrawerListener channelId={channelId} />
					<HomeDefaultHeader openBottomSheet={openBottomSheet} navigation={props.navigation} onOpenDrawer={onOpenDrawer} />
					<View style={{ flex: 1 }}>
						<ChannelMessages
							channelId={channelId}
							clanId={clanId}
							isPublic={isPublicChannel}
							mode={isThread ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
						/>
					</View>
					{isChannelApp && <ChannelAppHotbar channelId={channelId} clanId={clanId} />}
					<ChatBox
						channelId={channelId}
						mode={isThread ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
						hiddenIcon={{
							threadIcon: channelType === ChannelType.CHANNEL_TYPE_THREAD
						}}
						isPublic={isPublicChannel}
						topicChannelId={''}
					/>
					<PanelKeyboard currentChannelId={channelId} currentClanId={clanId} />

					<AgeRestrictedModal />
				</KeyboardAvoidingView>
			</LinearGradient>
		);
	},
	(prevProps, nextProps) => {
		return prevProps?.channelId === nextProps?.channelId;
	}
);

HomeDefault.displayName = 'HomeDefault';

export default HomeDefault;
