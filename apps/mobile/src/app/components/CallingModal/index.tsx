import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { Block, ThemeModeBase, size, useTheme } from '@mezon/mobile-ui';
import {
	DMCallActions,
	selectAllAccount,
	selectAllUserClans,
	selectIsInCall,
	selectSignalingDataByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { WebrtcSignalingType } from 'mezon-js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, Vibration, View } from 'react-native';
import Sound from 'react-native-sound';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../assets/lottie';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';

const CallingModal = () => {
	const { themeValue, theme } = useTheme();
	const styles = style(themeValue);
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const ringtoneRef = useRef<Sound | null>(null);
	const navigation = useNavigation<any>();
	const userProfile = useSelector(selectAllAccount);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userProfile?.user?.id || ''));
	const isInCall = useSelector(selectIsInCall);
	const usersClan = useSelector(selectAllUserClans);
	const mezon = useMezon();

	const callerInfo = useMemo(() => {
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];

		if (latestSignalingEntry?.callerId) {
			return usersClan.find((user) => user.id === latestSignalingEntry?.callerId);
		} else {
			return {};
		}
	}, [signalingData, usersClan]);

	const stopAndReleaseSound = () => {
		if (ringtoneRef.current) {
			ringtoneRef.current.pause();
			ringtoneRef.current.stop();
			ringtoneRef.current.release();
			ringtoneRef.current = null;
		}
	};

	useEffect(() => {
		let timer: string | number | NodeJS.Timeout;
		const statusInCallListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SET_STATUS_IN_CALL, ({ status = false }) => {
			timer = setTimeout(() => {
				if (!status) dispatch(DMCallActions.removeAll());
				dispatch(DMCallActions.setIsInCall(status));
			}, 4000);
		});

		return () => {
			timer && clearTimeout(timer);
			statusInCallListener.remove();
		};
	}, [dispatch]);

	useEffect(() => {
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		if (signalingData && !!latestSignalingEntry && !isVisible && !isInCall && ![4, 5]?.includes(latestSignalingEntry?.signalingData?.data_type)) {
			setIsVisible(true);
			Sound.setCategory('Playback');

			// Initialize ringtone
			const sound = new Sound('ringing.mp3', Sound.MAIN_BUNDLE, (error) => {
				if (error) {
					console.error('failed to load the sound', error);
					return;
				}
				sound.play((success) => {
					if (!success) {
						console.error('Sound playback failed');
					}
				});
				sound.setNumberOfLoops(-1);
				ringtoneRef.current = sound;
				playVibration();
			});
		} else if ([0, 4, 5]?.includes?.(latestSignalingEntry?.signalingData?.data_type) || isInCall) {
			setIsVisible(false);
			stopAndReleaseSound();
			Vibration.cancel();
		} else {
			/* empty */
		}

		// Cleanup function
		return () => {
			stopAndReleaseSound();
			Vibration.cancel();
		};
	}, [isInCall, isVisible, signalingData]);

	const playVibration = () => {
		const pattern = Platform.select({
			ios: [0, 1000, 2000, 1000, 2000],
			android: [0, 1000, 1000, 1000, 1000]
		});
		Vibration.vibrate(pattern, true);
	};

	const onJoinCall = () => {
		dispatch(DMCallActions.setIsInCall(true));
		stopAndReleaseSound();
		Vibration.cancel();
		setIsVisible(false);
		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
			params: {
				receiverId: signalingData?.[signalingData?.length - 1]?.callerId,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				receiverAvatar: callerInfo?.user?.avatar_url || '',
				isAnswerCall: true
			}
		});
	};

	const onDeniedCall = async () => {
		dispatch(DMCallActions.removeAll());
		setIsVisible(false);
		stopAndReleaseSound();
		Vibration.cancel();
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		await mezon.socketRef.current?.forwardWebrtcSignaling(
			latestSignalingEntry?.callerId,
			WebrtcSignalingType.WEBRTC_SDP_QUIT,
			'',
			latestSignalingEntry?.signalingData?.channel_id,
			''
		);
	};

	if (!isVisible) {
		return <View />;
	}

	return (
		<View style={styles.centeredView}>
			<Block flex={1} paddingRight={size.s_10}>
				<Block alignItems={'center'} flexDirection={'row'}>
					<Text numberOfLines={1} style={styles.headerTitle}>
						Mezon audio
					</Text>
					<LottieView source={theme === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE} autoPlay loop style={styles.threeDot} />
				</Block>

				<Text numberOfLines={1} style={styles.userName}>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
					{/* @ts-expect-error */}
					{callerInfo?.user?.username || ''}
				</Text>
			</Block>
			<Block gap={size.s_10} flexDirection={'row'}>
				<TouchableOpacity onPress={onDeniedCall} style={[styles.btnControl, styles.btnDenied]}>
					<Icons.CloseLargeIcon width={size.s_20} height={size.s_20} />
				</TouchableOpacity>
				<TouchableOpacity onPress={onJoinCall} style={[styles.btnControl, styles.btnAccept]}>
					<Icons.CheckmarkLargeIcon width={size.s_20} height={size.s_20} />
				</TouchableOpacity>
			</Block>
		</View>
	);
};

export default CallingModal;
