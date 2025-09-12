import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { groupCallActions, selectCurrentUserId, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import LottieView from 'lottie-react-native';
import { safeJSONParse, WebrtcSignalingFwd } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, Vibration, View } from 'react-native';
import Sound from 'react-native-sound';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../assets/lottie';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { style } from './styles';

type ICallingGroupProps = {
	dataCall: WebrtcSignalingFwd;
};

interface CallSignalingData {
	is_video: boolean;
	group_id: string;
	group_name: string;
	group_avatar?: string;
	caller_id: string;
	caller_name: string;
	caller_avatar?: string;
	meeting_code?: string;
	clan_id?: string;
	timestamp: number;
	participants: string[];
	action?: string;
	reason?: string;
}

export const useSendSignaling = () => {
	const mezon = useMezon();

	const sendSignalingToParticipants = useCallback(
		(participants: string[], signalType: number, data: CallSignalingData | Record<string, any>, channelId: string, currentUserId: string) => {
			if (!participants?.length || !channelId || !currentUserId) {
				return;
			}

			const socket = mezon.socketRef.current;
			if (!socket) {
				console.error('Socket not available for signaling');
				return;
			}

			participants.forEach((userId) => {
				if (userId !== currentUserId) {
					try {
						socket.forwardWebrtcSignaling(userId, signalType, JSON.stringify(data), channelId, currentUserId);
						if (
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_OFFER ||
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT ||
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_CANCEL ||
							signalType === WEBRTC_SIGNALING_TYPES.GROUP_CALL_TIMEOUT
						) {
							const isCancel = signalType !== WEBRTC_SIGNALING_TYPES.GROUP_CALL_OFFER;
							markCallPushMobile({ receiverId: userId, currentUserId, data, isCancel });
						}
					} catch (error) {
						console.error('Failed to send signaling to participant:', userId, error);
					}
				}
			});
		},
		[mezon]
	);

	const markCallPushMobile = useCallback(
		({
			receiverId,
			currentUserId,
			data,
			isCancel
		}: {
			receiverId: string;
			currentUserId: string;
			isCancel: boolean;
			data: CallSignalingData | Record<string, any>;
		}) => {
			const socket = mezon.socketRef.current;
			if (!socket) {
				console.error('Socket not available for push notifications');
				return;
			}

			if (isCancel) {
				const bodyFCMMobile = { offer: 'CANCEL_CALL' };
				socket.makeCallPush(receiverId, JSON.stringify(bodyFCMMobile), data.group_id, currentUserId);
				return;
			}

			const groupName = data?.group_name || 'Group Call';
			const offerGroupCall = {
				isGroupCall: true,
				groupId: data.group_id,
				groupName,
				groupAvatar: data.group_avatar || '',
				meetingCode: data.meeting_code,
				callerId: currentUserId
			};

			const bodyFCMMobile = {
				offer: JSON.stringify(offerGroupCall),
				callerName: `Group Call ${groupName}`,
				callerAvatar: '',
				callerId: currentUserId,
				channelId: data.group_id
			};

			socket.makeCallPush(receiverId, JSON.stringify(bodyFCMMobile), data.group_id, currentUserId);
		},
		[mezon]
	);

	return { sendSignalingToParticipants };
};

const parseSignalingData = (jsonData?: string): CallSignalingData | null => {
	if (!jsonData) return null;

	try {
		return safeJSONParse(jsonData);
	} catch {
		return null;
	}
};

const CallingGroupModal = ({ dataCall }: ICallingGroupProps) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const ringtoneRef = useRef<Sound | null>(null);
	const userId = useSelector(selectCurrentUserId);
	const { sendSignalingToParticipants } = useSendSignaling();
	const { t } = useTranslation('message');

	const callData = useMemo(() => {
		return parseSignalingData(dataCall?.json_data as string);
	}, [dataCall?.json_data]);

	const stopAndReleaseSound = () => {
		if (ringtoneRef.current) {
			ringtoneRef.current.pause();
			ringtoneRef.current.stop();
			ringtoneRef.current.release();
			ringtoneRef.current = null;
		}
	};

	useEffect(() => {
		if (dataCall?.caller_id && callData) {
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
		} else {
			setIsVisible(false);
			stopAndReleaseSound();
			Vibration.cancel();
		}
	}, [callData, dataCall?.caller_id]);

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
		if (dataCall?.channel_id && callData) {
			dispatch(groupCallActions.hideIncomingGroupCall());
			if (!callData.meeting_code) return;
			const data = {
				channelId: dataCall.channel_id || '',
				roomName: callData?.meeting_code,
				clanId: '',
				isGroupCall: true
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, data);
			const joinAction = {
				participant_id: userId,
				participant_name: '',
				participant_avatar: '',
				timestamp: Date.now()
			};
			sendSignalingToParticipants(
				[dataCall?.caller_id],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_PARTICIPANT_JOINED,
				joinAction,
				dataCall?.channel_id || '',
				userId || ''
			);
		}
	};

	const onDeniedCall = async () => {
		stopAndReleaseSound();
		Vibration.cancel();
		setIsVisible(false);
		const quitAction = {
			is_video: callData?.is_video || false,
			group_id: dataCall?.channel_id || '',
			caller_id: userId,
			caller_name: callData?.caller_name || '',
			timestamp: Date.now(),
			action: 'decline'
		};
		sendSignalingToParticipants(
			[dataCall?.caller_id],
			WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT,
			quitAction,
			dataCall?.channel_id || '',
			userId || ''
		);
		dispatch(groupCallActions.hideIncomingGroupCall());
		dispatch(groupCallActions.endGroupCall());
	};

	if (!isVisible) {
		return <View />;
	}

	return (
		<View style={styles.centeredView}>
			<View style={{ flex: 1, paddingRight: size.s_10 }}>
				<View style={{ alignItems: 'center', flexDirection: 'row' }}>
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

				<Text style={styles.username}>
					{callData.caller_name || ''}
					{' is inviting you to join '}
				</Text>
				<Text numberOfLines={1} style={styles.memberInGroup}>
					{`${callData?.participants.length} members in this group`}
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

export default CallingGroupModal;
