import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { ActionEmitEvent, Icons, getChannelById } from '@mezon/mobile-components';
import { Block, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, channelMembersActions, selectChannelsEntities, selectCurrentChannel, useAppDispatch } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { useFocusEffect } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, DeviceEventEmitter, Keyboard, Platform, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import NotificationSetting from '../../../components/NotificationSetting';
import useStatusMuteChannel, { EActionMute } from '../../../hooks/useStatusMuteChannel';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import ChannelMessages from './ChannelMessages';
import ChatBox from './ChatBox';
import AttachmentPicker from './components/AttachmentPicker';
import BottomKeyboardPicker, { IModeKeyboardPicker } from './components/BottomKeyboardPicker';
import EmojiPicker from './components/EmojiPicker';
import { style } from './styles';

const HomeDefault = React.memo((props: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useSelector(selectCurrentChannel);
	const [heightKeyboardShow, setHeightKeyboardShow] = useState<number>(0);
	const [typeKeyboardBottomSheet, setTypeKeyboardBottomSheet] = useState<IModeKeyboardPicker>('text');
	const bottomPickerRef = useRef<BottomSheet>(null);
	const [isFocusChannelView, setIsFocusChannelView] = useState(false);

	const dispatch = useAppDispatch();

	const prevChannelIdRef = useRef<string>();

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, height: number, type?: IModeKeyboardPicker) => {
		setHeightKeyboardShow(height);
		if (isShow) {
			setTypeKeyboardBottomSheet(type);
			bottomPickerRef.current?.collapse();
		} else {
			setTypeKeyboardBottomSheet('text');
			bottomPickerRef.current?.close();
		}
	}, []);

	const bottomSheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ['15%', '40%'], []);
	const [isShowSettingNotifyBottomSheet, setIsShowSettingNotifyBottomSheet] = useState<boolean>(false);

	const openBottomSheet = () => {
		Keyboard.dismiss();
		bottomSheetRef.current?.snapToIndex(1);
		setIsShowSettingNotifyBottomSheet(!isShowSettingNotifyBottomSheet);
	};

	const closeBottomSheet = () => {
		bottomSheetRef.current?.close();
		setIsShowSettingNotifyBottomSheet(false);
	};
	const renderBackdrop = useCallback((props) => <BottomSheetBackdrop {...props} opacity={0.5} onPress={closeBottomSheet} appearsOnIndex={1} />, []);

	useFocusEffect(
		useCallback(() => {
			setIsFocusChannelView(true);
			if (prevChannelIdRef.current !== currentChannel?.channel_id) {
				fetchMemberChannel();
			}
			prevChannelIdRef.current = currentChannel?.channel_id;
			return () => {
				setIsFocusChannelView(false);
			};
		}, [currentChannel?.channel_id]),
	);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			appStateSubscription.remove();
		};
	}, []);

	const handleAppStateChange = async (state: string) => {
		if (state === 'background') {
			Keyboard.dismiss();
			setHeightKeyboardShow(0);
		}
	};

	const fetchMemberChannel = async () => {
		if (!currentChannel) {
			return;
		}
		await dispatch(
			channelMembersActions.fetchChannelMembers({
				clanId: currentChannel?.clan_id || '',
				channelId: currentChannel?.channel_id || '',
				channelType: currentChannel?.type,
			}),
		);
	};

	const onOpenDrawer = () => {
		onShowKeyboardBottomSheet(false, 0, 'text');
		props.navigation.openDrawer();
		Keyboard.dismiss();
	};

	const handleGesture = (event: { nativeEvent: { translationX: number; state: number } }) => {
		if (event.nativeEvent.translationX >= 5 && event.nativeEvent.state === State.CANCELLED) {
			onOpenDrawer();
		}
	};

	return (
		<View style={[styles.homeDefault]}>
			<HomeDefaultHeader
				openBottomSheet={openBottomSheet}
				navigation={props.navigation}
				currentChannel={currentChannel}
				onOpenDrawer={onOpenDrawer}
			/>
			{currentChannel && isFocusChannelView && (
				<View style={styles.channelView}>
					<PanGestureHandler onGestureEvent={handleGesture} onHandlerStateChange={handleGesture} activeOffsetX={[-10, 10]}>
						<View style={{ flex: 1 }}>
							<ChannelMessages
								channelId={currentChannel.channel_id}
								channelLabel={currentChannel?.channel_label}
								mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
							/>
						</View>
					</PanGestureHandler>
					{heightKeyboardShow !== 0 && typeKeyboardBottomSheet !== 'text' && (
						<Block position={'absolute'} flex={1} height={'100%'} width={'100%'}>
							<TouchableOpacity style={{ flex: 1 }} onPress={() => onShowKeyboardBottomSheet(false, 0, 'text')}></TouchableOpacity>
						</Block>
					)}

					<ChatBox
						channelId={currentChannel.channel_id}
						channelLabel={currentChannel?.channel_label || ''}
						mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
						onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
					/>

					<View
						style={{
							height: Platform.OS === 'ios' || typeKeyboardBottomSheet !== 'text' ? heightKeyboardShow : 0,
							backgroundColor: themeValue.secondary,
						}}
					/>
					{heightKeyboardShow !== 0 && typeKeyboardBottomSheet !== 'text' && (
						<BottomKeyboardPicker height={heightKeyboardShow} ref={bottomPickerRef} isStickyHeader={typeKeyboardBottomSheet === 'emoji'}>
							{typeKeyboardBottomSheet === 'emoji' ? (
								<EmojiPicker
									onDone={() => {
										onShowKeyboardBottomSheet(false, heightKeyboardShow, 'text');
										DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, {});
									}}
									bottomSheetRef={bottomPickerRef}
								/>
							) : typeKeyboardBottomSheet === 'attachment' ? (
								<AttachmentPicker currentChannelId={currentChannel.channel_id} currentClanId={currentChannel?.clan_id} />
							) : (
								<View />
							)}
						</BottomKeyboardPicker>
					)}
				</View>
			)}
			<BottomSheet
				ref={bottomSheetRef}
				enablePanDownToClose={true}
				backdropComponent={renderBackdrop}
				index={-1}
				snapPoints={snapPoints}
				backgroundStyle={{ backgroundColor: themeValue.secondary }}
			>
				<BottomSheetView>{isShowSettingNotifyBottomSheet && <NotificationSetting />}</BottomSheetView>
			</BottomSheet>
		</View>
	);
});

const HomeDefaultHeader = React.memo(
	({
		navigation,
		currentChannel,
		openBottomSheet,
		onOpenDrawer,
	}: {
		navigation: any;
		currentChannel: ChannelsEntity;
		openBottomSheet: () => void;
		onOpenDrawer: () => void;
	}) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const navigateMenuThreadDetail = () => {
			navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET });
		};
		const channelsEntities = useSelector(selectChannelsEntities);
		const [channelOfThread, setChannelOfThread] = useState<ChannelsEntity>(null);
		const { statusMute } = useStatusMuteChannel();

		useEffect(() => {
			setChannelOfThread(getChannelById(currentChannel?.parrent_id, channelsEntities));
		}, [currentChannel?.parrent_id, channelsEntities]);
		return (
			<View style={styles.homeDefaultHeader}>
				<TouchableOpacity style={{ flex: 1 }} onPress={navigateMenuThreadDetail}>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<TouchableOpacity activeOpacity={0.8} style={styles.iconBar} onPress={onOpenDrawer}>
							<Icons.ArrowLargeLeftIcon width={20} height={20} color={themeValue.textStrong} />
						</TouchableOpacity>
						{!!currentChannel?.channel_label && (
							<View style={styles.channelContainer}>
								{!!currentChannel?.channel_label && !!Number(currentChannel?.parrent_id) ? (
									<Icons.ThreadPlusIcon width={20} height={20} color={themeValue.textStrong} />
								) : currentChannel?.channel_private === ChannelStatusEnum.isPrivate &&
								  currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT ? (
									<Icons.TextLockIcon width={20} height={20} color={themeValue.textStrong} />
								) : (
									<Icons.TextIcon width={20} height={20} color={themeValue.textStrong} />
								)}
								<View>
									<View style={styles.threadHeaderBox}>
										<Text style={styles.threadHeaderLabel} numberOfLines={1}>
											{currentChannel?.channel_label}
										</Text>
									</View>
									{channelOfThread?.channel_label && (
										<Text style={styles.channelHeaderLabel} numberOfLines={1}>
											{channelOfThread?.channel_label}
										</Text>
									)}
								</View>
							</View>
						)}
					</View>
				</TouchableOpacity>
				{!!currentChannel?.channel_label && (
					<TouchableOpacity style={styles.iconBell} onPress={() => openBottomSheet()}>
						{/* <SearchIcon width={22} height={22} style={{ marginRight: 20 }} /> */}
						{statusMute === EActionMute.Mute ? (
							<Icons.BellSlashIcon width={20} height={20} color={themeValue.textStrong} />
						) : (
							<Icons.BellIcon width={20} height={20} color={themeValue.textStrong} />
						)}
					</TouchableOpacity>
				)}
			</View>
		);
	},
);

export default HomeDefault;
