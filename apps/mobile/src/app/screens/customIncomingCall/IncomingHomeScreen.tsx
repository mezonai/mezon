import { ActionEmitEvent, IS_ANSWER_CALL_FROM_NATIVE, load } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, appActions, selectCurrentUserId, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { WEBRTC_SIGNALING_TYPES, sleep } from '@mezon/utils';
import LottieView from 'lottie-react-native';
import { WebrtcSignalingFwd, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import * as React from 'react';
import { memo, useEffect, useMemo, useRef } from 'react';
import {
	BackHandler,
	DeviceEventEmitter,
	Image,
	ImageBackground,
	NativeModules,
	Platform,
	Text,
	TouchableOpacity,
	Vibration,
	View
} from 'react-native';
import { Bounce } from 'react-native-animated-spinkit';
import { useSelector } from 'react-redux';
import { useSendSignaling } from '../../components/CallingGroupModal';
import NotificationPreferences from '../../utils/NotificationPreferences';
import { DirectMessageCallMain } from '../messages/DirectMessageCall';

import { registerGlobals } from '@livekit/react-native';
import notifee from '@notifee/react-native';
import Sound from 'react-native-sound';
import ChannelVoicePopup from '../home/homedrawer/components/ChannelVoicePopup';
import LOTTIE_PHONE_DECLINE from './phone-decline.json';
import LOTTIE_PHONE_RING from './phone-ring.json';
import { style } from './styles';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BG_CALLING from './bgCalling.png';
registerGlobals();
const AVATAR_DEFAULT = `${process.env.NX_BASE_IMG_URL}/1775731152322039808/1820659489792069632/mezon_logo.png`;
const IncomingHomeScreen = memo((props: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const [isInCall, setIsInCall] = React.useState(false);
	const [isInGroupCall, setIsInGroupCall] = React.useState(false);
	const [dataCalling, setDataCalling] = React.useState<any>();
	const userId = useSelector(selectCurrentUserId);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const mezon = useMezon();
	const ringtoneRef = useRef<Sound | null>(null);
	const { sendSignalingToParticipants } = useSendSignaling();
	const [dataCallGroup, setDataCallGroup] = React.useState<any>(null);
	const isForceAnswer = useMemo(() => {
		return load(IS_ANSWER_CALL_FROM_NATIVE);
	}, []);

	const onKillApp = () => {
		try {
			if (Platform.OS === 'android') {
				notifee.cancelNotification('incoming-call', 'incoming-call');
				NativeModules?.DeviceUtils?.killApp();
				BackHandler.exitApp();
			} else {
				BackHandler.exitApp();
			}
		} catch (e) {
			console.error('log  => onKillApp', e);
			BackHandler.exitApp();
		}
	};

	const getDataNotifyObject = async (data) => {
		try {
			const dataObj = safeJSONParse(data?.offer || '{}');
			return dataObj || {};
		} catch (e) {
			console.error('log  => getDataNotiObject', e);
			return {};
		}
	};
	const getDataCall = async () => {
		try {
			const notificationData = await NotificationPreferences.getValue('notificationDataCalling');
			if (!notificationData) return;

			const notificationDataParse = safeJSONParse(notificationData || '{}');
			const data = safeJSONParse(notificationDataParse?.offer || '{}');
			const dataObj = await getDataNotifyObject(data);
			if (dataObj?.isGroupCall) {
				setDataCallGroup(dataObj);
				await NotificationPreferences.clearValue('notificationDataCalling');
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
				await NotificationPreferences.clearValue('notificationDataCalling');
			} else if (notificationData) {
				await NotificationPreferences.clearValue('notificationDataCalling');
			} else {
				/* empty */
			}
		} catch (error) {
			console.error('Failed to retrieve data', error);
		}
	};

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

	useEffect(() => {
		let timer;
		if (isForceAnswer && signalingData?.[signalingData?.length - 1]?.callerId) {
			timer = setTimeout(() => {
				onJoinCall();
			}, 1000);
		}

		if (
			(signalingData?.[signalingData?.length - 1]?.signalingData.data_type === WebrtcSignalingType.WEBRTC_SDP_QUIT ||
				signalingData?.[signalingData?.length - 1]?.signalingData.data_type === WebrtcSignalingType.WEBRTC_SDP_INIT) &&
			!isInCall
		) {
			stopAndReleaseSound();
			onKillApp();
		}

		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [isForceAnswer, isInCall, signalingData]);

	useEffect(() => {
		if (props && props?.payload) {
			playVibration();
			getDataCall();
		}

		return () => {
			stopAndReleaseSound();
		};
	}, [props]);

	const params = {
		receiverId: signalingData?.[signalingData?.length - 1]?.callerId,
		receiverAvatar: props?.avatar || dataCalling?.callerAvatar || '',
		isAnswerCall: true,
		isFromNative: true
	};

	const onDeniedCall = async () => {
		stopAndReleaseSound();
		if (dataCallGroup) {
			const quitAction = {
				is_video: false,
				group_id: dataCallGroup.groupId || '',
				caller_id: userId,
				caller_name: dataCallGroup.groupName || '',
				timestamp: Date.now(),
				action: 'decline'
			};
			sendSignalingToParticipants(
				[dataCallGroup?.callerId],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT,
				quitAction,
				dataCallGroup?.groupId || '',
				userId || ''
			);
			onKillApp();
			return;
		}
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		if (!latestSignalingEntry || !mezon.socketRef.current) {
			onKillApp();
			return;
		}

		await mezon.socketRef.current?.forwardWebrtcSignaling(
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
		if (Platform.OS === 'android') {
			try {
				NativeModules?.CallStateModule?.setIsInCall?.(true);
			} catch (error) {
				console.error('Error calling native methods:', error);
			}
		}
		if (dataCallGroup) {
			await handleJoinCallGroup(dataCallGroup);
			setIsInGroupCall(true);
			stopAndReleaseSound();
			return;
		}
		dispatch(DMCallActions.setIsInCall(true));
		if (!signalingData?.[signalingData?.length - 1]?.callerId) return;
		stopAndReleaseSound();
		setIsInCall(true);
	};

	const playVibration = () => {
		Vibration.vibrate([300, 500, 300, 500], true);
	};

	const stopAndReleaseSound = () => {
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
	};

	const handleJoinCallGroup = async (dataCall: any) => {
		if (dataCall?.groupId) {
			if (!dataCall?.meetingCode) return;
			const data = {
				channelId: dataCall.groupId || '',
				roomName: dataCall?.meetingCode,
				isGroupCall: true,
				clanId: ''
			};
			await sleep(1000);
			DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, data);
			const joinAction = {
				participant_id: userId,
				participant_name: '',
				participant_avatar: '',
				timestamp: Date.now()
			};
			sendSignalingToParticipants(
				[dataCall?.callerId],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_PARTICIPANT_JOINED,
				joinAction,
				dataCall?.channel_id || '',
				userId || ''
			);
		}
	};
	if (isInCall) {
		return <DirectMessageCallMain route={{ params }} />;
	}

	return (
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
			<ChannelVoicePopup isFromNativeCall={true} />
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
	);
});

export default IncomingHomeScreen;
