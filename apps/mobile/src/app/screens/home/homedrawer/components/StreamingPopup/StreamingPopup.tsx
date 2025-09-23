import { size } from '@mezon/mobile-ui';
import {
	appActions,
	selectAllAccount,
	selectCurrentChannel,
	selectCurrentClan,
	selectSession,
	useAppDispatch,
	videoStreamActions
} from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { useSelector } from 'react-redux';
import { useWebRTCStream } from '../../../../../components/StreamContext/StreamContext';
import StreamingRoom from '../StreamingRoom';

const MINIMIZED_WIDTH = size.s_80 * 2;
const MINIMIZED_HEIGHT = size.s_100;

const StreamingPopup = () => {
	const pan = useRef(new Animated.ValueXY()).current;
	const isDragging = useRef(false);
	const isFullScreen = useRef(true);
	const [isAnimationComplete, setIsAnimationComplete] = useState(true);
	const currentClan = useSelector(selectCurrentClan);
	const currentChannel = useSelector(selectCurrentChannel);
	const { handleChannelClick, disconnect } = useWebRTCStream();
	const userProfile = useSelector(selectAllAccount);
	const sessionUser = useSelector(selectSession);
	const dispatch = useAppDispatch();

	const resetPosition = useCallback(() => {
		if (!isFullScreen.current) {
			pan.setValue({ x: 0, y: 0 });
		}
	}, [pan]);

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

	useEffect(() => {
		if (sessionUser?.token) handleJoinStreamingRoom();
	}, [sessionUser?.token]);

	const handleJoinStreamingRoom = async () => {
		if (currentClan && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
			disconnect();
			handleChannelClick(
				currentClan?.id as string,
				currentChannel?.channel_id as string,
				userProfile?.user?.id as string,
				currentChannel.channel_id as string,
				userProfile?.user?.username as string,
				sessionUser?.token as string
			);
			dispatch(
				videoStreamActions.startStream({
					clanId: currentClan.id || '',
					clanName: currentClan.clan_name || '',
					streamId: currentChannel.channel_id || '',
					streamName: currentChannel.channel_label || '',
					parentId: currentChannel.parent_id || ''
				})
			);
			dispatch(appActions.setIsShowChatStream(false));
		}
	};

	const handleResizeStreamRoom = () => {
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
	};

	const handlePressMinimizeRoom = useCallback(() => {
		isFullScreen.current = false;
		handleResizeStreamRoom();
	}, []);

	return (
		<Animated.View
			{...panResponder.panHandlers}
			style={[
				{
					transform: [{ translateX: pan?.x }, { translateY: pan?.y }],
					zIndex: 99,
					position: 'absolute',
					width: isAnimationComplete ? '100%' : MINIMIZED_WIDTH,
					height: isAnimationComplete ? '100%' : MINIMIZED_HEIGHT
				}
			]}
		>
			<StreamingRoom isAnimationComplete={isAnimationComplete} onPressMinimizeRoom={handlePressMinimizeRoom} />
		</Animated.View>
	);
};

export default StreamingPopup;
