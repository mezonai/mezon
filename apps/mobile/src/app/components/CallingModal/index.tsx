import { ActionEmitEvent, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, selectAllUserClans, selectIsInCall, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import LottieView from 'lottie-react-native';
import { WebrtcSignalingType } from 'mezon-js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, DeviceEventEmitter, NativeModules, Platform, Text, TouchableOpacity, Vibration, View } from 'react-native';
import Sound from 'react-native-sound';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../assets/lottie';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { DirectMessageCallMain } from '../../screens/messages/DirectMessageCall';
import { decompress } from '../../utils/helpers';
import { displayNativeCalling } from '../../utils/pushNotificationHelpers';
import { style } from './styles';

const CallingModal = () => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const ringtoneRef = useRef<Sound | null>(null);
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const isInCall = useSelector(selectIsInCall);
	const usersClan = useSelector(selectAllUserClans);
	const mezon = useMezon();
	const { t } = useTranslation('message');
	const [callerInfo, setCallerInfo] = useState<any>({});

	useEffect(() => {
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		const getCallerInfo = async () => {
			const jsonData = latestSignalingEntry?.signalingData?.json_data;

			if (jsonData) {
				try {
					const decompressedData = await decompress(jsonData);
					const parsedData = JSON.parse(decompressedData);
					if (parsedData?.callerName) {
						setCallerInfo({
							name: parsedData?.callerName || '',
							avatar: parsedData?.callerAvatar || ''
						});
						return;
					}
				} catch (error) {
					console.error('Error decompressing or parsing JSON data:', error);
				}
			}

			// Find caller in user's clans
			if (latestSignalingEntry?.callerId) {
				const foundUser = usersClan.find((user) => user.id === latestSignalingEntry?.callerId);
				setCallerInfo(foundUser || {});
			} else {
				setCallerInfo({});
			}
		};

		latestSignalingEntry?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER && getCallerInfo();
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
		if (isInCall || !isVisible) {
			stopAndReleaseSound();
			Vibration.cancel();
		}
	}, [isInCall, isVisible]);

	useEffect(() => {
		return () => {
			stopAndReleaseSound();
			Vibration.cancel();
		};
	}, []);

	useEffect(() => {
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		const dataType = latestSignalingEntry?.signalingData?.data_type;
		if (!isInCall && dataType === WebrtcSignalingType.WEBRTC_SDP_OFFER) {
			setIsVisible(true);
			Sound.setCategory(Platform.OS === 'ios' ? 'Playback' : 'Ambient', Platform.OS === 'ios');

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
		} else {
			setIsVisible(false);
			clearUpStorageCalling();
			stopAndReleaseSound();
			Vibration.cancel();
		}
	}, [isInCall, signalingData]);

	useEffect(() => {
		if (Platform.OS === 'ios') {
			return;
		}

		const processSignaling = (currentState) => {
			const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
			const dataType = latestSignalingEntry?.signalingData?.data_type;
			if (currentState === 'background') {
				if (!isInCall && dataType === WebrtcSignalingType.WEBRTC_SDP_OFFER && callerInfo?.name) {
					displayCallerNotificationAndroid(latestSignalingEntry);
				} else {
					displayCallerNotificationAndroid(latestSignalingEntry, true);
				}
			} else {
				displayNativeCalling({
					offer: JSON.stringify({
						offer: 'CANCEL_CALL'
					})
				});
			}
		};

		const handleAppStateChange = (nextAppState) => {
			// Only process signaling when app state actually changes
			processSignaling(nextAppState);
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);
		return () => subscription?.remove();
	}, [isInCall, signalingData, callerInfo]);

	const playVibration = () => {
		const pattern = Platform.select({
			ios: [0, 1000, 2000, 1000, 2000],
			android: [0, 1000, 1000, 1000, 1000]
		});
		Vibration.vibrate(pattern, true);
	};

	const onJoinCall = () => {
		stopAndReleaseSound();
		Vibration.cancel();
		setIsVisible(false);
		const params = {
			receiverId: signalingData?.[signalingData?.length - 1]?.callerId,
			receiverAvatar: callerInfo?.avatar || callerInfo?.user?.avatar_url || '',
			receiverName: callerInfo?.name || callerInfo?.user?.display_name || callerInfo?.user?.username || '',
			isAnswerCall: true
		};
		const data = {
			children: <DirectMessageCallMain route={{ params }} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const onDeniedCall = async () => {
		dispatch(DMCallActions.removeAll());
		clearUpStorageCalling();
		setIsVisible(false);
		stopAndReleaseSound();
		Vibration.cancel();
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		await mezon.socketRef.current?.forwardWebrtcSignaling(
			latestSignalingEntry?.callerId,
			WebrtcSignalingType.WEBRTC_SDP_QUIT,
			'{}',
			latestSignalingEntry?.signalingData?.channel_id,
			userId
		);
	};

	const clearUpStorageCalling = async () => {
		if (Platform.OS === 'ios') {
			const VoIPManager = NativeModules?.VoIPManager;
			if (VoIPManager) {
				await VoIPManager.clearStoredNotificationData();
			} else {
				console.error('VoIPManager is not available');
			}
		}
	};

	const displayCallerNotificationAndroid = async (signalingEntry, isCancelCall = false) => {
		if (isCancelCall) {
			displayNativeCalling({
				offer: JSON.stringify({
					offer: 'CANCEL_CALL'
				})
			});
			return;
		}
		const data = {
			offer: signalingEntry.signalingData.json_data,
			callerName: callerInfo?.name,
			callerAvatar: callerInfo?.avatar,
			channelId: signalingEntry.signalingData.channel_id,
			callerId: signalingEntry.callerId
		};
		displayNativeCalling({ offer: JSON.stringify(data) }, true);
	};

	if (!isVisible) {
		return <View />;
	}

	return (
		<View style={styles.centeredView}>
			<View style={styles.headerContainer}>
				<View style={styles.headerRow}>
					<Text numberOfLines={1} style={styles.headerTitle}>
						{t('callLog.incomingCall')}
					</Text>
					<LottieView
						source={themeBasic === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE}
						autoPlay
						loop
						style={styles.threeDot}
					/>
				</View>

				<Text numberOfLines={1} style={styles.username}>
					{callerInfo?.name || callerInfo?.user?.username || ''}
				</Text>
			</View>
			<View style={styles.buttonContainer}>
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
