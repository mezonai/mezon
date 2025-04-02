import { ActionEmitEvent, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	DMCallActions,
	selectAllUserClans,
	selectIsInCall,
	selectSignalingDataByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { safeJSONParse, WebrtcSignalingFwd, WebrtcSignalingType } from 'mezon-js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, DeviceEventEmitter, NativeModules, Platform, Text, TouchableOpacity, Vibration, View } from 'react-native';
import Sound from 'react-native-sound';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../assets/lottie';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';

const CallingModal = () => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const ringtoneRef = useRef<Sound | null>(null);
	const navigation = useNavigation<any>();
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
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
		if (
			signalingData &&
			!!latestSignalingEntry &&
			!isVisible &&
			!isInCall &&
			latestSignalingEntry?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER
		) {
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
			stopAndReleaseSound();
			Vibration.cancel();
		}
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
			<View style={{ flex: 1, paddingRight: size.s_10 }}>
				<View style={{ alignItems: 'center', flexDirection: 'row' }}>
					<Text numberOfLines={1} style={styles.headerTitle}>
						Mezon audio
					</Text>
					<LottieView
						source={themeBasic === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE}
						autoPlay
						loop
						style={styles.threeDot}
					/>
				</View>

				<Text numberOfLines={1} style={styles.username}>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
					{/* @ts-expect-error */}
					{callerInfo?.user?.username || ''}
				</Text>
			</View>
			<View style={{ gap: size.s_10, flexDirection: 'row' }}>
				<TouchableOpacity onPress={onDeniedCall} style={[styles.btnControl, styles.btnDenied]}>
					<MezonIconCDN icon={IconCDN.closeLargeIcon} width={size.s_20} height={size.s_20} />
				</TouchableOpacity>
				<TouchableOpacity onPress={onJoinCall} style={[styles.btnControl, styles.btnAccept]}>
					<MezonIconCDN icon={IconCDN.checkmarkLargeIcon} width={size.s_20} height={size.s_20} />
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default CallingModal;
