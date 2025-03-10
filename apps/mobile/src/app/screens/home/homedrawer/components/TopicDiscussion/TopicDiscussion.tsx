import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	messagesActions,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentTopicId,
	topicsActions,
	useAppDispatch
} from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import ShareLocationConfirmModal from '../../../../../components/ShareLocationConfirmModal';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import ChannelMessagesWrapper from '../../ChannelMessagesWrapper';
import { ChatBox } from '../../ChatBox';
import PanelKeyboard from '../../PanelKeyboard';
import { IModeKeyboardPicker } from '../BottomKeyboardPicker';
import TopicHeader from './TopicHeader/TopicHeader';
import { style } from './styles';

export default function TopicDiscussion() {
	const { themeValue, themeBasic } = useTheme();
	const currentTopicId = useSelector(selectCurrentTopicId);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannel = useSelector(selectCurrentChannel);
	const panelKeyboardRef = useRef(null);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();

	useEffect(() => {
		const focusedListener = navigation.addListener('focus', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.primary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content');
		});
		const blurListener = navigation.addListener('blur', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.secondary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content');
		});
		return () => {
			focusedListener();
			blurListener();
		};
	}, [navigation, themeBasic, themeValue.primary, themeValue.secondary]);

	const styles = style(themeValue);
	useEffect(() => {
		const fetchMsgResult = async () => {
			await dispatch(
				messagesActions.fetchMessages({
					channelId: currentChannel?.channel_id,
					clanId: currentClanId,
					topicId: currentTopicId || ''
				})
			);
		};
		if (currentTopicId !== '') {
			fetchMsgResult();
		}
	}, []);

	useEffect(() => {
		return () => {
			dispatch(topicsActions.setCurrentTopicId(''));
			dispatch(topicsActions.setIsShowCreateTopic(false));
		};
	}, [currentChannel?.channel_id, dispatch]);

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	const onHandlerStateChange = useCallback(
		(event: { nativeEvent: { translationX: any; velocityX: any } }) => {
			const { translationX, velocityX } = event.nativeEvent;
			if (translationX > 50 && velocityX > 300) {
				navigation.goBack();
			}
		},
		[navigation]
	);

	useFocusEffect(
		useCallback(() => {
			dispatch(appActions.setIsFocusOnChannelInput(false));

			return () => {
				dispatch(appActions.setIsFocusOnChannelInput(true));
			};
		}, [dispatch])
	);

	const onGoBack = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	return (
		<View style={styles.channelView}>
			<StatusBarHeight />
			<TopicHeader
				mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
				handleBack={onGoBack}
			/>
			<KeyboardAvoidingView style={styles.channelView} behavior={'padding'} keyboardVerticalOffset={0}>
				<PanGestureHandler failOffsetY={[-5, 5]} onHandlerStateChange={onHandlerStateChange}>
					<View style={{ flex: 1 }}>
						<ChannelMessagesWrapper
							channelId={currentTopicId}
							topicId={currentTopicId}
							clanId={currentClanId}
							isPublic={isPublicChannel(currentChannel)}
							mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
							topicChannelId={currentChannel?.channel_id}
						/>
					</View>
				</PanGestureHandler>
				<ChatBox
					channelId={currentChannel?.channel_id}
					mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
					hiddenIcon={{
						threadIcon: currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD
					}}
					isPublic={isPublicChannel(currentChannel)}
				/>
				<PanelKeyboard ref={panelKeyboardRef} currentChannelId={currentChannel?.channel_id} currentClanId={currentChannel?.clan_id} />
				<ShareLocationConfirmModal
					channelId={currentChannel?.channel_id}
					mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
				/>
			</KeyboardAvoidingView>
		</View>
	);
}
