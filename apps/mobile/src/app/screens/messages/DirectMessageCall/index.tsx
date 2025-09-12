import { RTCView } from '@livekit/react-native-webrtc';
import { ActionEmitEvent, IS_ANSWER_CALL_FROM_NATIVE, save } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, selectAllAccount, selectRemoteVideo, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { IMessageTypeCallLog } from '@mezon/utils';
import notifee from '@notifee/react-native';
import { WebrtcSignalingType } from 'mezon-js';
import React, { memo, useEffect, useState } from 'react';
import { Alert, BackHandler, DeviceEventEmitter, NativeModules, Platform, TouchableOpacity, View } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import FastImage from 'react-native-fast-image';
import InCallManager from 'react-native-incall-manager';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import Images from '../../../../assets/Images';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../constants/icon_cdn';
import { useWebRTCCallMobile } from '../../../hooks/useWebRTCCallMobile';
import { ConnectionState } from './ConnectionState';
import { style } from './styles';

interface IDirectMessageCallProps {
	route: any;
}

export const DirectMessageCallMain = memo(({ route }: IDirectMessageCallProps) => {
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const styles = style(themeValue);
	const { receiverId, directMessageId } = route.params;
	const receiverAvatar = route.params?.receiverAvatar;
	const isVideoCall = route.params?.isVideoCall;
	const isAnswerCall = route.params?.isAnswerCall;
	const isFromNative = route.params?.isFromNative;
	const userProfile = useSelector(selectAllAccount);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userProfile?.user?.id || ''));
	const isRemoteVideo = useSelector(selectRemoteVideo);
	const [isMirror, setIsMirror] = useState<boolean>(true);

	const {
		callState,
		localMediaControl,
		timeStartConnected,
		isConnected,
		startCall,
		handleEndCall,
		toggleSpeaker,
		toggleAudio,
		toggleVideo,
		handleSignalingMessage,
		switchCamera,
		handleToggleIsConnected,
		playDialToneIOS
	} = useWebRTCCallMobile({
		dmUserId: receiverId,
		userId: userProfile?.user?.id as string,
		channelId: directMessageId as string,
		isVideoCall,
		isFromNative,
		callerName: userProfile?.user?.username,
		callerAvatar: userProfile?.user?.avatar_url
	});

	useEffect(() => {
		if (!isAnswerCall) {
			try {
				if (Platform.OS === 'ios') {
					playDialToneIOS();
				} else {
					const { AudioSessionModule } = NativeModules;
					AudioSessionModule.playDialTone();
				}
			} catch (e) {
				console.error('e', e);
			}
		}
		notifee.stopForegroundService();
		notifee.cancelNotification('incoming-call', 'incoming-call');
		notifee.cancelDisplayedNotification('incoming-call', 'incoming-call');
		save(IS_ANSWER_CALL_FROM_NATIVE, false);
	}, [isAnswerCall]);

	const initSpeakerConfig = async () => {
		if (Platform.OS === 'android') {
			const { CustomAudioModule } = NativeModules;
			await CustomAudioModule.setSpeaker(false, null);
			InCallManager.setSpeakerphoneOn(false);
		} else {
			InCallManager.setSpeakerphoneOn(false);
			InCallManager.setForceSpeakerphoneOn(false);
		}
	};

	const onCancelCall = async () => {
		try {
			if (Platform.OS === 'ios') {
				RNCallKeep.endAllCalls();
			}
			await handleEndCall({});
			if (!timeStartConnected?.current) {
				await dispatch(
					DMCallActions.updateCallLog({
						channelId: directMessageId,
						content: {
							t: '',
							callLog: {
								isVideo: isVideoCall,
								callLogType: IMessageTypeCallLog.CANCELCALL
							}
						}
					})
				);
			}
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		} catch (err) {
			/* empty */
		}
	};

	const handleSwitchCamera = async () => {
		const result = await switchCamera();
		if (result) {
			setIsMirror(!isMirror);
		}
	};

	useEffect(() => {
		const lastSignalingData = signalingData?.[signalingData.length - 1]?.signalingData;
		if (lastSignalingData) {
			const dataType = lastSignalingData?.data_type;

			if ([WebrtcSignalingType.WEBRTC_SDP_QUIT, WebrtcSignalingType.WEBRTC_SDP_TIMEOUT].includes(dataType)) {
				if (!timeStartConnected?.current) {
					const callLogType =
						dataType === WebrtcSignalingType.WEBRTC_SDP_TIMEOUT ? IMessageTypeCallLog.TIMEOUTCALL : IMessageTypeCallLog.REJECTCALL;
					dispatch(
						DMCallActions.updateCallLog({
							channelId: directMessageId || '',
							content: {
								t: '',
								callLog: { isVideo: isVideoCall, callLogType }
							}
						})
					);
				}
				handleEndCall({});
				if (dataType === WebrtcSignalingType.WEBRTC_SDP_JOINED_OTHER_CALL) {
					Toast.show({
						type: 'error',
						text1: 'User is currently on another call',
						text2: 'Please call back later!'
					});
					if (isFromNative) {
						InCallManager.stop();
						if (Platform.OS === 'android') {
							NativeModules?.DeviceUtils?.killApp();
							BackHandler.exitApp();
						} else {
							BackHandler.exitApp();
						}
						return;
					}
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
				}
			}
		}

		if (lastSignalingData) {
			handleSignalingMessage(lastSignalingData);
		}
	}, [signalingData, timeStartConnected.current]);

	useEffect(() => {
		dispatch(DMCallActions.setIsInCall(true));
		InCallManager.start({ media: 'audio' });
		if (isAnswerCall) {
			handleToggleIsConnected(false);
		}
		const timer = setTimeout(() => {
			startCall(isVideoCall, isAnswerCall);
		}, 1000);

		return () => {
			clearTimeout(timer);
			InCallManager.stop();
		};
	}, [isAnswerCall, isVideoCall]);

	useEffect(() => {
		initSpeakerConfig();
	}, []);

	return (
		<View style={styles.container}>
			{!isFromNative && <StatusBarHeight />}

			<View style={[styles.menuHeader]}>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20 }}>
					<TouchableOpacity
						onPress={() => {
							Alert.alert('End Call', 'Are you sure you want to end the call?', [
								{
									text: 'Cancel',
									style: 'cancel'
								},
								{
									text: 'OK',
									onPress: () => {
										onCancelCall();
									}
								}
							]);
						}}
						style={styles.buttonCircle}
					>
						<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.white} />
					</TouchableOpacity>
				</View>
				{isConnected !== null && <ConnectionState isConnected={isConnected} />}
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
					{callState.localStream && localMediaControl?.camera && (
						<View>
							<TouchableOpacity onPress={handleSwitchCamera} style={[styles.buttonCircle]}>
								<MezonIconCDN icon={IconCDN.cameraFront} height={size.s_24} width={size.s_24} color={themeValue.white} />
							</TouchableOpacity>
						</View>
					)}
					<View>
						<TouchableOpacity
							onPress={toggleSpeaker}
							style={[styles.buttonCircle, localMediaControl.speaker && styles.buttonCircleActive]}
						>
							<MezonIconCDN
								icon={localMediaControl.speaker ? IconCDN.channelVoice : IconCDN.voiceLowIcon}
								color={localMediaControl.speaker ? themeValue.secondaryLight : themeValue.white}
							/>
						</TouchableOpacity>
					</View>
				</View>
			</View>

			<TouchableOpacity activeOpacity={1} style={[styles.main]}>
				<View style={{ flex: 1 }}>
					{callState.remoteStream && isRemoteVideo ? (
						<View style={styles.card}>
							<RTCView streamURL={callState.remoteStream.toURL()} style={{ flex: 1 }} mirror={true} objectFit={'cover'} />
						</View>
					) : (
						<View style={[styles.card, styles.cardNoVideo]}>
							<FastImage source={receiverAvatar ? { uri: receiverAvatar } : Images.ANONYMOUS_AVATAR} style={styles.avatar} />
						</View>
					)}
					{callState.localStream && localMediaControl?.camera ? (
						<View style={styles.card}>
							<RTCView streamURL={callState.localStream.toURL()} style={{ flex: 1 }} mirror={isMirror} objectFit={'cover'} />
						</View>
					) : (
						<View style={[styles.card, styles.cardNoVideo]}>
							<FastImage source={{ uri: userProfile?.user?.avatar_url }} style={styles.avatar} />
						</View>
					)}
				</View>
			</TouchableOpacity>
			<View style={[styles.menuFooter]}>
				<View style={{ borderRadius: size.s_40, backgroundColor: themeValue.primary }}>
					<View
						style={{
							gap: size.s_30,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: size.s_14
						}}
					>
						<TouchableOpacity onPress={toggleVideo} style={[styles.menuIcon, localMediaControl?.camera && styles.menuIconActive]}>
							{localMediaControl?.camera ? (
								<MezonIconCDN icon={IconCDN.videoIcon} width={size.s_24} height={size.s_24} color={themeValue.black} />
							) : (
								<MezonIconCDN icon={IconCDN.videoSlashIcon} width={size.s_24} height={size.s_24} color={themeValue.text} />
							)}
						</TouchableOpacity>
						<TouchableOpacity onPress={toggleAudio} style={[styles.menuIcon, localMediaControl?.mic && styles.menuIconActive]}>
							{localMediaControl?.mic ? (
								<MezonIconCDN icon={IconCDN.microphoneIcon} width={size.s_24} height={size.s_24} color={themeValue.black} />
							) : (
								<MezonIconCDN icon={IconCDN.microphoneDenyIcon} width={size.s_24} height={size.s_24} color={themeValue.text} />
							)}
						</TouchableOpacity>
						<TouchableOpacity onPress={onCancelCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
							<MezonIconCDN icon={IconCDN.phoneCallIcon} />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</View>
	);
});
