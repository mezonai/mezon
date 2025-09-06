import { ActionEmitEvent } from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { messagesActions, selectCurrentChannel, selectCurrentClanId, selectCurrentTopicId, topicsActions, useAppDispatch } from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import ChannelMessages from '../../ChannelMessages';
import { ChatBox } from '../../ChatBox';
import PanelKeyboard from '../../PanelKeyboard';
import TopicHeader from './TopicHeader/TopicHeader';
import { style } from './styles';

export default function TopicDiscussion() {
	const { themeValue, themeBasic } = useTheme();
	const currentTopicId = useSelector(selectCurrentTopicId);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannel = useSelector(selectCurrentChannel);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();

	useEffect(() => {
		const focusedListener = navigation.addListener('focus', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.primary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.LIGHT || themeBasic === ThemeModeBase.SUNRISE ? 'dark-content' : 'light-content');
		});
		const blurListener = navigation.addListener('blur', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.secondary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.LIGHT || themeBasic === ThemeModeBase.SUNRISE ? 'dark-content' : 'light-content');
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
	}, [currentChannel?.channel_id, currentClanId, currentTopicId]);

	useEffect(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
			isShow: false,
			mode: ''
		});
		return () => {
			dispatch(topicsActions.setCurrentTopicId(''));
			dispatch(topicsActions.setIsShowCreateTopic(false));
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false,
				mode: ''
			});
		};
	}, [currentChannel?.channel_id, dispatch]);

	const onHandlerStateChange = useCallback(
		(event: { nativeEvent: { translationX: any; velocityX: any } }) => {
			const { translationX, velocityX } = event.nativeEvent;
			if (translationX > 50 && velocityX > 300) {
				navigation.goBack();
			}
		},
		[navigation]
	);

	const onGoBack = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	return (
		<View style={styles.channelView}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<KeyboardAvoidingView
				style={styles.channelView}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			>
				<TopicHeader
					mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					handleBack={onGoBack}
				/>
				<PanGestureHandler failOffsetY={[-5, 5]} onHandlerStateChange={onHandlerStateChange}>
					<View style={{ flex: 1 }}>
						<ChannelMessages
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
					hiddenIcon={{
						threadIcon: true
					}}
					isPublic={isPublicChannel(currentChannel)}
					topicChannelId={currentTopicId}
				/>
				<PanelKeyboard currentChannelId={currentTopicId || currentChannel?.channel_id} currentClanId={currentChannel?.clan_id} />
			</KeyboardAvoidingView>
		</View>
	);
}
