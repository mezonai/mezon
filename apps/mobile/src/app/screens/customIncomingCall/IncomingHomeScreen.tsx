import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, appActions, selectCurrentUserId, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { WEBRTC_SIGNALING_TYPES, sleep } from '@mezon/utils';
import LottieView from 'lottie-react-native';
import { WebrtcSignalingFwd, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import * as React from 'react';
import { memo, useEffect, useRef } from 'react';
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
import { DirectMessageCall } from '../messages/DirectMessageCall';

import Sound from 'react-native-sound';
import ChannelVoicePopup from '../home/homedrawer/components/ChannelVoicePopup';
import LOTTIE_PHONE_DECLINE from './phone-decline.json';
import LOTTIE_PHONE_RING from './phone-ring.json';
import { style } from './styles';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BG_CALLING from './bgCalling.png';

const AVATAR_DEFAULT = `${process.env.NX_BASE_IMG_URL}/1775731152322039808/1820659489792069632/mezon_logo.png`;
const IncomingHomeScreen = memo((props: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const [isInCall, setIsInCall] = React.useState(false);
	const [isInGroupCall, setIsInGroupCall] = React.useState(false);
	const [dataCalling, setDataCalling] = React.useState(false);
	const userId = useSelector(selectCurrentUserId);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const mezon = useMezon();
	const ringtoneRef = useRef<Sound | null>(null);
	const { sendSignalingToParticipants } = useSendSignaling();
	const [dataCallGroup, setDataCallGroup] = React.useState<any>(null);

	const getDataCall = async () => {
		try {
			const notificationData = await NotificationPreferences.getValue('notificationDataCalling');
			if (!notificationData) return;

			const notificationDataParse = safeJSONParse(notificationData || '{}');
			const data = safeJSONParse(notificationDataParse?.offer || '{}');
			const dataObj = safeJSONParse(data?.offer || '{}');
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
		const timer = setTimeout(() => {
			if (!isInCall && !isInGroupCall) {
				onDeniedCall();
			}
		}, 40000);

		return () => clearTimeout(timer);
	}, [isInCall, isInGroupCall]);

	useEffect(() => {
		let timer;
		if (props?.isForceAnswer && signalingData?.[signalingData?.length - 1]?.callerId) {
			timer = setTimeout(() => {
				onJoinCall();
			}, 1000);
		}

		if (signalingData?.[signalingData?.length - 1]?.signalingData.data_type === WebrtcSignalingType.WEBRTC_SDP_QUIT) {
			stopAndReleaseSound();
			BackHandler.exitApp();
		}

		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [signalingData]);

	useEffect(() => {
		if (props && props?.payload && Platform.OS === 'android') {
			playVibration();
			getDataCall();
		}
	}, [props]);

	const params = {
		receiverId: signalingData?.[signalingData?.length - 1]?.callerId,
		receiverAvatar: props?.avatar || '',
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
			BackHandler.exitApp();
			return;
		}
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		if (!latestSignalingEntry || !mezon.socketRef.current) {
			BackHandler.exitApp();
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
		BackHandler.exitApp();
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
		if (!signalingData?.[signalingData?.length - 1]?.callerId) return;
		stopAndReleaseSound();
		dispatch(DMCallActions.setIsInCall(true));
		setIsInCall(true);
	};

	const playVibration = () => {
		const pattern = Platform.select({
			ios: [0, 1000, 2000, 1000, 2000],
			android: [0, 1000, 1000, 1000, 1000]
		});
		Vibration.vibrate(pattern, true);
	};

	const stopAndReleaseSound = () => {
		Vibration.cancel();
		if (ringtoneRef.current) {
			ringtoneRef.current.pause();
			ringtoneRef.current.stop();
			ringtoneRef.current.release();
			ringtoneRef.current = null;
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
		return <DirectMessageCall route={{ params }} />;
	}

	return (
		<ImageBackground source={BG_CALLING} style={styles.container}>
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
			{!props?.isForceAnswer ? (
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
			) : (
				<View style={styles.wrapperConnecting}>
					<Bounce size={size.s_80} color="#fff" />
					<Text style={styles.callerName}>Connecting...</Text>
				</View>
			)}
		</ImageBackground>
	);
});

export default IncomingHomeScreen;
