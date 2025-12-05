import { registerGlobals } from '@livekit/react-native';
import { save, STORAGE_LATEST_CALL_CACHE } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { appActions, DMCallActions, selectCurrentUserId, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import notifee from '@notifee/react-native';
import LottieView from 'lottie-react-native';
import type { WebrtcSignalingFwd } from 'mezon-js';
import { safeJSONParse, WebrtcSignalingType } from 'mezon-js';
import * as React from 'react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { BackHandler, Image, ImageBackground, NativeModules, Platform, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { Bounce } from 'react-native-animated-spinkit';
import Sound from 'react-native-sound';
import { useSelector } from 'react-redux';
import NotificationPreferences from '../../utils/NotificationPreferences';
import ChannelVoicePopup from '../home/homedrawer/components/ChannelVoicePopup';
import type { ButtonAnswerCallGroupRef } from './ButtonAnswerCallGroup';
import ButtonAnswerCallGroup from './ButtonAnswerCallGroup';
import type { CallDetailNativeRef } from './CallDetailNative';
import { CallDetailNative } from './CallDetailNative';
import LOTTIE_PHONE_DECLINE from './phone-decline.json';
import LOTTIE_PHONE_RING from './phone-ring.json';
import { style } from './styles';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BG_CALLING from './bgCalling.png';

registerGlobals();
const AVATAR_DEFAULT = `${process.env.NX_BASE_IMG_URL}/1775731152322039808/1820659489792069632/mezon_logo.png`;
let retryCount = 0;
const maxRetries = 5;
const retryInterval = 500;
const IncomingHomeScreen = memo((props: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const [isInCall, setIsInCall] = React.useState(false);
	const [isForceAnswer, setIsForceAnswer] = React.useState(false);
	const [isForceDecline, setIsForceDecline] = React.useState(false);
	const [isInGroupCall, setIsInGroupCall] = React.useState(false);
	const [dataCalling, setDataCalling] = React.useState<any>();
	const [isSocketConnected, setIsSocketConnected] = React.useState(false);
	const [isCallConnected, setIsCallConnected] = React.useState(false);
	const userId = useSelector(selectCurrentUserId);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const { socketRef } = useMezon();
	const ringtoneRef = useRef<Sound | null>(null);
	const [dataCallGroup, setDataCallGroup] = React.useState<any>(null);
	const callDetailRef = useRef<CallDetailNativeRef>(null);
	const buttonAnswerCallGroupRef = useRef<ButtonAnswerCallGroupRef>(null);

	const stopAndReleaseSound = useCallback(async () => {
		try {
			if (ringtoneRef.current) {
				ringtoneRef.current.pause();
				ringtoneRef.current.stop();
				ringtoneRef.current.release();
				ringtoneRef.current = null;
			}
			Vibration.cancel();
		} catch (e) {
			console.error('log  => topAndReleaseSound', e);
		}
	}, []);

	const playVibrationAndSound = useCallback(() => {
		Sound.setCategory('Playback');
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
			sound.setVolume(1.0);
			ringtoneRef.current = sound;
		});
		Vibration.vibrate([300, 500, 300, 500], true);
	}, []);

	const loadDataInit = async () => {
		const dataInit = await notifee.getInitialNotification();
		const pressActionId = dataInit?.pressAction?.id;
		if (pressActionId === 'accept') {
			setIsForceAnswer(true);
		} else if (pressActionId === 'reject') {
			setIsForceDecline(true);
		} else {
			//
		}
	};

	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;
		const checkSocketStatus = () => {
			const isOpen = socketRef?.current?.isOpen?.();
			setIsSocketConnected(!!isOpen);
			if (isOpen && intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};
		checkSocketStatus();

		if (!socketRef?.current?.isOpen?.()) {
			intervalId = setInterval(checkSocketStatus, 500);
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [socketRef]);

	const onKillApp = useCallback(async () => {
		try {
			if (Platform.OS === 'android') {
				await notifee.cancelNotification('incoming-call', 'incoming-call');
				NativeModules?.DeviceUtils?.killApp();
				BackHandler.exitApp();
			} else {
				BackHandler.exitApp();
			}
		} catch (e) {
			BackHandler.exitApp();
		}
	}, []);

	const getDataCall = useCallback(async () => {
		try {
			const notificationData = await NotificationPreferences.getValue('notificationDataCalling');
			if (!notificationData) return;

			const notificationDataParse = safeJSONParse(notificationData || '{}');
			const data = safeJSONParse(notificationDataParse?.offer || '{}');
			const dataObj = await safeJSONParse(data?.offer || '{}');
			if (dataObj?.isGroupCall) {
				setDataCallGroup(dataObj);
				return;
			}
			if (data?.offer !== 'CANCEL_CALL' && !!data?.offer && !dataObj?.isGroupCall) {
				setDataCalling(data);
				dispatch(appActions.setLoadingMainMobile(true));
				const signalingData = {
					channel_id: data?.channelId,
					receiver_id: userId,
					json_data: data?.offer,
					data_type: WebrtcSignalingType.WEBRTC_SDP_OFFER,
					caller_id: data?.callerId
				};
				dispatch(
					DMCallActions.addOrUpdate({
						calleeId: userId,
						signalingData: signalingData as WebrtcSignalingFwd,
						id: data?.callerId,
						callerId: data?.callerId
					})
				);
			}
		} catch (error) {
			console.error('Failed to retrieve data', error);
		}
	}, [dispatch, userId]);

	useEffect(() => {
		notifee.stopForegroundService();
		notifee.cancelNotification('incoming-call', 'incoming-call');
		notifee.cancelDisplayedNotification('incoming-call', 'incoming-call');
		const timer = setTimeout(() => {
			if (!isInCall && !isInGroupCall) {
				onDeniedCall();
			}
		}, 30000);

		return () => clearTimeout(timer);
	}, [isInCall, isInGroupCall]);

	const onDeniedCall = async () => {
		stopAndReleaseSound();
		save(STORAGE_LATEST_CALL_CACHE, '{}');
		if (dataCallGroup) {
			await buttonAnswerCallGroupRef?.current?.onDeniedCall();
			onKillApp();
			return;
		}
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		if (!latestSignalingEntry || !socketRef.current) {
			onKillApp();
			return;
		}

		await socketRef.current?.forwardWebrtcSignaling(
			latestSignalingEntry?.callerId,
			WebrtcSignalingType.WEBRTC_SDP_QUIT,
			'{}',
			latestSignalingEntry?.signalingData?.channel_id,
			userId
		);
		dispatch(DMCallActions.removeAll());
		onKillApp();
	};

	const onJoinCall = async () => {
		save(STORAGE_LATEST_CALL_CACHE, '{}');
		if (Platform.OS === 'android') {
			try {
				NativeModules?.CallStateModule?.setIsInCall?.(true);
			} catch (error) {
				console.error('Error calling native methods:', error);
			}
		}
		const tryHandleICECandidate = async () => {
			if (callDetailRef?.current) {
				await callDetailRef.current?.handleICECandidate?.();
				return true;
			}
			return false;
		};
		const success = await tryHandleICECandidate();
		if (!success) {
			const retryTimer = setInterval(async () => {
				retryCount++;
				const retrySuccess = await tryHandleICECandidate();

				if (retrySuccess || retryCount >= maxRetries || !!callDetailRef?.current) {
					clearInterval(retryTimer);
				}
			}, retryInterval);
		}
		dispatch(DMCallActions.setIsInCall(true));
		stopAndReleaseSound();
		setIsInCall(true);
	};

	useEffect(() => {
		if (!isInCall) {
			if (isForceAnswer && signalingData?.[signalingData?.length - 1]?.callerId && !!dataCalling?.callerId) {
				onJoinCall();
			}

			if (signalingData?.[signalingData?.length - 1]?.signalingData.data_type === WebrtcSignalingType.WEBRTC_SDP_QUIT) {
				NotificationPreferences?.clearValue?.('notificationDataCalling');
				stopAndReleaseSound();
				onKillApp();
			}
		}

		return () => {
			NotificationPreferences.clearValue('notificationDataCalling');
		};
	}, [isForceAnswer, isInCall, onKillApp, dataCalling, signalingData, stopAndReleaseSound]);

	useEffect(() => {
		if (isForceDecline && isSocketConnected) {
			buttonAnswerCallGroupRef?.current?.onDeniedCall();
			onDeniedCall();
		}
	}, [isForceDecline, isSocketConnected, onDeniedCall, signalingData]);

	useEffect(() => {
		if (props && props?.payload) {
			playVibrationAndSound();
			getDataCall();
		}
		loadDataInit();
		return () => {
			stopAndReleaseSound();
		};
	}, [props]);

	const onDeniedCallGroup = useCallback(() => {
		stopAndReleaseSound();
		onKillApp();
	}, [onKillApp, stopAndReleaseSound]);

	const onJoinCallGroup = useCallback(() => {
		if (Platform.OS === 'android') {
			try {
				NativeModules?.CallStateModule?.setIsInCall?.(true);
			} catch (error) {
				console.error('Error calling native methods:', error);
			}
		}
		setIsInGroupCall(true);
		stopAndReleaseSound();
	}, [stopAndReleaseSound]);

	const onIsConnected = useCallback(() => {
		NotificationPreferences.clearValue('notificationDataCalling');
		setIsCallConnected(true);
	}, []);

	return (
		<View style={{ flex: 1 }}>
			{!!dataCalling?.callerId && isSocketConnected && (
				<CallDetailNative
					ref={callDetailRef}
					receiverId={dataCalling?.callerId}
					directMessageId={dataCalling?.channelId}
					isVideoCall={dataCalling?.isVideoCall}
					onIsConnected={onIsConnected}
					receiverAvatar={props?.avatar || dataCalling?.callerAvatar || ''}
					receiverName={dataCalling?.callerName || ''}
					isAnswerCall={true}
					isFromNative={true}
				/>
			)}
			{!isCallConnected && (
				<ImageBackground
					source={BG_CALLING}
					style={[
						styles.container,
						isInGroupCall && {
							paddingVertical: 0,
							paddingHorizontal: 0
						}
					]}
				>
					{!!dataCallGroup && <ChannelVoicePopup isFromNativeCall={true} />}
					{/* Caller Info */}
					<View style={styles.headerCall}>
						<Text style={styles.callerName}>{dataCallGroup ? 'Group ' : ''}Incoming Call</Text>
						<Image
							source={{
								uri: dataCallGroup?.groupAvatar || dataCalling?.callerAvatar || AVATAR_DEFAULT
							}}
							style={styles.callerImage}
						/>
						<Text style={styles.callerInfo}>{dataCallGroup?.groupName || dataCalling?.callerName || ''}</Text>
					</View>

					{/* Decline and Answer Buttons */}
					{isForceAnswer && dataCallGroup === null ? (
						<View style={styles.wrapperConnecting}>
							<Bounce size={size.s_80} color="#fff" />
							<Text style={styles.callerName}>Connecting...</Text>
						</View>
					) : isForceDecline && dataCallGroup === null ? (
						<View style={styles.wrapperConnecting}>
							<Bounce size={size.s_80} color={baseColor.redStrong} />
							<Text style={[styles.callerName, { color: baseColor.redStrong }]}>Cancel Call</Text>
						</View>
					) : dataCallGroup ? (
						<ButtonAnswerCallGroup
							ref={buttonAnswerCallGroupRef}
							dataCallGroup={dataCallGroup}
							onDeniedCallGroup={onDeniedCallGroup}
							onJoinCallGroup={onJoinCallGroup}
						/>
					) : (
						<View style={styles.buttonContainer}>
							<TouchableOpacity onPress={onDeniedCall}>
								{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
								{/*// @ts-expect-error*/}
								<LottieView source={LOTTIE_PHONE_DECLINE} autoPlay loop style={styles.deniedCall} />
							</TouchableOpacity>

							<TouchableOpacity onPress={onJoinCall}>
								<LottieView source={LOTTIE_PHONE_RING} autoPlay loop style={styles.answerCall} />
							</TouchableOpacity>
						</View>
					)}
				</ImageBackground>
			)}
		</View>
	);
});

export default IncomingHomeScreen;
