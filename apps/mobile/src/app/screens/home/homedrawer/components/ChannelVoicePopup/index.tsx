import { useAuth } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import {
	appActions,
	generateMeetToken,
	getStoreAsync,
	handleParticipantVoiceState,
	selectIsPiPMode,
	selectVoiceInfo,
	selectVoiceJoined,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store-mobile';
import { ParticipantMeetState, sleep } from '@mezon/utils';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, DeviceEventEmitter, Dimensions, Keyboard, PanResponder } from 'react-native';
import Toast from 'react-native-toast-message';
import ChannelVoice from '../ChannelVoice';

const MINIMIZED_WIDTH = size.s_100 * 2;
const MINIMIZED_HEIGHT = size.s_150;

const ChannelVoicePopup = ({ isFromNativeCall = false }) => {
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL || '';
	const pan = useRef(new Animated.ValueXY()).current;
	const isDragging = useRef(false);
	const isFullScreen = useRef(true);
	const [isAnimationComplete, setIsAnimationComplete] = useState(true);
	const [voicePlay, setVoicePlay] = useState(false);
	const dispatch = useAppDispatch();
	const [token, setToken] = useState<string>('');
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const [isGroupCall, setIsGroupCall] = useState(false);
	const [participantsCount, setParticipantsCount] = useState(0);
	const { userProfile } = useAuth();

	const resetPosition = useCallback(() => {
		if (!isFullScreen.current && !isPiPMode) {
			pan.setValue({ x: 0, y: 0 });
		}
	}, [isPiPMode, pan]);

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', () => {
			resetPosition();
		});
		return () => {
			subscription && subscription.remove();
		};
	}, [resetPosition]);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				isDragging.current = false;
				if (!isFullScreen.current) {
					pan?.setOffset({
						x: (pan?.x as any)?._value,
						y: (pan?.y as any)?._value
					});
					pan?.setValue({ x: 0, y: 0 });
				}
			},
			onPanResponderMove: (e, gestureState) => {
				if (!isFullScreen.current) {
					if (Math.abs(gestureState?.dx) > 10 || Math.abs(gestureState?.dy) > 10) {
						isDragging.current = true;
					}
					const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

					const offsetX = (pan?.x as any)?._offset || 0;
					const offsetY = (pan?.y as any)?._offset || 0;

					const dx = Math.max(-offsetX, Math.min(screenWidth - MINIMIZED_WIDTH - offsetX, gestureState?.dx));
					const dy = Math.max(-offsetY, Math.min(screenHeight - MINIMIZED_HEIGHT - offsetY, gestureState?.dy));

					Animated.event([null, { dx: pan?.x, dy: pan?.y }], { useNativeDriver: false })(e, {
						...gestureState,
						dx,
						dy
					});
				}
			},
			onPanResponderRelease: (e, gestureState) => {
				const totalDistance = Math.sqrt(gestureState?.dx ** 2 + gestureState?.dy ** 2);
				if (totalDistance > 10) {
					isDragging.current = true;
				}

				if (!isDragging.current) {
					isFullScreen.current = !isFullScreen.current;
					handleResizeStreamRoom();
				}

				if (!isFullScreen.current) {
					pan?.flattenOffset();
				}
			}
		})
	).current;

	const participantMeetState = async (state: ParticipantMeetState, clanId: string, channelId: string, roomId = ''): Promise<void> => {
		if (!clanId || !channelId || !userProfile?.user?.id) return;
		await dispatch(
			handleParticipantVoiceState({
				clan_id: clanId,
				channel_id: channelId,
				display_name: userProfile?.user?.display_name ?? '',
				state,
				room_name: roomId
			})
		);
	};

	const handleLeaveRoom = async (clanId: string, channelId: string, roomId: string) => {
		if (channelId) {
			await participantMeetState(ParticipantMeetState.LEAVE, clanId, channelId, roomId);
			dispatch(voiceActions.resetVoiceControl());
		}
	};

	const handleJoinChannelVoice = async (roomName: string, channelId: string, clanId: string) => {
		if (!roomName) return;
		dispatch(appActions.setLoadingMainMobile(true));
		try {
			const result = await dispatch(
				generateMeetToken({
					channelId,
					roomName
				})
			).unwrap();
			if (result) {
				dispatch(
					voiceActions.setVoiceInfo({
						clanId: clanId as string,
						clanName: '',
						channelId: channelId as string,
						channelLabel: '',
						channelPrivate: 1
					})
				);
				await participantMeetState(ParticipantMeetState.JOIN, clanId as string, channelId as string);
				setToken(result);
				dispatch(voiceActions.setJoined(true));
				dispatch(appActions.setLoadingMainMobile(false));
				setVoicePlay(true);
			} else {
				setToken('');
				dispatch(appActions.setLoadingMainMobile(false));
			}
		} catch (err) {
			console.error('Failed to join room:', err);
			setToken('');
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleResizeStreamRoom = useCallback(() => {
		if (isFullScreen.current) {
			pan?.flattenOffset();
			Animated.timing(pan, {
				toValue: { x: 0, y: 0 },
				duration: 300,
				useNativeDriver: true
			}).start(() => {
				setIsAnimationComplete(true);
			});
		} else {
			pan?.flattenOffset();
			Animated.timing(pan, {
				toValue: { x: 0, y: 0 },
				duration: 300,
				useNativeDriver: true
			}).start(() => {
				setIsAnimationComplete(false);
			});
		}
	}, [pan]);

	useEffect(() => {
		if (isAnimationComplete || voicePlay) {
			Keyboard.dismiss();
		}
	}, [isAnimationComplete, voicePlay]);

	const handlePressMinimizeRoom = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		isFullScreen.current = false;
		handleResizeStreamRoom();
	}, [handleResizeStreamRoom]);

	useEffect(() => {
		const eventOpenMezonMeet = DeviceEventEmitter.addListener(ActionEmitEvent.ON_OPEN_MEZON_MEET, async (data) => {
			try {
				const store = await getStoreAsync();
				const voiceInfo = selectVoiceInfo(store.getState());
				const isJoined = selectVoiceJoined(store.getState());
				if (isJoined && !data?.isEndCall && voiceInfo?.channelId === data?.channelId) {
					Toast.show({
						type: 'info',
						text1: 'Already in the call',
						text2: 'You are already in this voice channel.'
					});
					return;
				}

				if (isJoined && !data?.isEndCall && voiceInfo?.channelId !== data?.channelId) {
					await handleLeaveRoom(voiceInfo?.clanId || '', voiceInfo?.channelId || '', data?.roomId);
					setToken('');
					setVoicePlay(false);
					dispatch(appActions.setLoadingMainMobile(true));
					await sleep(1000);
				}

				if (data?.isEndCall) {
					await handleLeaveRoom(data?.clanId, data?.channelId, data?.roomId);
					setIsGroupCall(false);
					setVoicePlay(false);
					if (isFromNativeCall) {
						BackHandler.exitApp();
					}
				} else {
					if (data?.isGroupCall) {
						setIsGroupCall(true);
						setParticipantsCount(data?.participantsCount || 0);
					}
					await handleJoinChannelVoice(data?.roomName, data?.channelId, data?.clanId);
				}
			} catch (e) {
				console.error('log  => e', e);
				dispatch(appActions.setLoadingMainMobile(false));
			}
		});
		return () => {
			eventOpenMezonMeet.remove();
		};
	}, [isFromNativeCall]);

	if (!voicePlay || !token) return null;
	return (
		<Animated.View
			{...(!isAnimationComplete && !isPiPMode ? panResponder.panHandlers : {})}
			style={[
				!isPiPMode && {
					transform: [{ translateX: pan?.x }, { translateY: pan?.y }]
				},
				{
					zIndex: 99,
					position: 'absolute',
					width: isAnimationComplete || isPiPMode ? '100%' : MINIMIZED_WIDTH,
					height: isAnimationComplete || isPiPMode ? '100%' : MINIMIZED_HEIGHT
				},
				isPiPMode && {
					top: 0,
					left: 0,
					right: 0,
					bottom: 0
				}
			]}
		>
			<ChannelVoice
				token={token}
				serverUrl={serverUrl}
				isAnimationComplete={isPiPMode ? true : isAnimationComplete}
				onPressMinimizeRoom={handlePressMinimizeRoom}
				isGroupCall={isGroupCall}
				participantsCount={participantsCount}
			/>
		</Animated.View>
	);
};

export default memo(ChannelVoicePopup, () => true);
