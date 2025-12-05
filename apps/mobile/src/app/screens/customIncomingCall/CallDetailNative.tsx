import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, selectAllAccount, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { IMessageTypeCallLog } from '@mezon/utils';
import { WebrtcSignalingType } from 'mezon-js';
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, DeviceEventEmitter, NativeModules, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { useWebRTCCallMobile } from '../../hooks/useWebRTCCallMobile';
import { RenderMainView } from '../messages/DirectMessageCall/RenderMainView';
import { style } from './styles';

interface IDirectMessageCallProps {
	isVideoCall?: boolean;
	isFromNative: boolean;
	isAnswerCall: boolean;
	receiverId: string;
	directMessageId: string;
	receiverAvatar: string;
	receiverName: string;
	onIsConnected?: () => void;
}

export interface CallDetailNativeRef {
	handleICECandidate: () => Promise<void>;
}

const maxRetries = 10;
const retryDelayMs = 500;
export const CallDetailNative = memo(
	forwardRef<CallDetailNativeRef, IDirectMessageCallProps>(
		({ isVideoCall = false, isAnswerCall, isFromNative, directMessageId, receiverId, onIsConnected, receiverName, receiverAvatar }, ref) => {
			const { themeValue } = useTheme();
			const dispatch = useAppDispatch();
			const styles = style(themeValue);
			const userProfile = useSelector(selectAllAccount);
			const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userProfile?.user?.id || ''));
			const [isMirror, setIsMirror] = useState<boolean>(true);
			const { t } = useTranslation(['dmMessage']);

			const {
				peerConnection,
				callState,
				localMediaControl,
				timeStartConnected,
				isConnected,
				candidateCache,
				startCall,
				handleEndCall,
				toggleSpeaker,
				toggleAudio,
				toggleVideo,
				handleSignalingMessage,
				switchCamera,
				handleToggleIsConnected,
				handleICECandidate
			} = useWebRTCCallMobile({
				dmUserId: receiverId,
				userId: userProfile?.user?.id as string,
				channelId: directMessageId as string,
				isVideoCall,
				isFromNative,
				callerName: userProfile?.user?.username,
				callerAvatar: userProfile?.user?.avatar_url
			});

			const retryCountRef = useRef<number>(0);
			const candidateCacheRef = useRef(candidateCache);

			useEffect(() => {
				candidateCacheRef.current = candidateCache;
			}, [candidateCache]);

			useEffect(() => {
				if (isConnected && onIsConnected) {
					onIsConnected();
				}
			}, [isConnected, onIsConnected]);

			const handleICECandidateWithRetry = useCallback(async () => {
				const executePush = async (attempt: number): Promise<void> => {
					const currentCandidateCache = candidateCacheRef.current;
					if (currentCandidateCache && !!peerConnection?.current) {
						await handleICECandidate(currentCandidateCache);
						retryCountRef.current = 0;
						return;
					}

					if (attempt < maxRetries) {
						retryCountRef.current = attempt + 1;
						await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
						return executePush(attempt + 1);
					}
					retryCountRef.current = 0;
				};

				await executePush(retryCountRef.current);
			}, [handleICECandidate]);

			useImperativeHandle(
				ref,
				() => ({
					handleICECandidate: handleICECandidateWithRetry
				}),
				[handleICECandidateWithRetry]
			);

			const onCancelCall = async () => {
				try {
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
								dataType === WebrtcSignalingType.WEBRTC_SDP_TIMEOUT
									? IMessageTypeCallLog.TIMEOUTCALL
									: IMessageTypeCallLog.REJECTCALL;
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
				startCall(isVideoCall, isAnswerCall);

				return () => {
					InCallManager.stop();
				};
			}, [isAnswerCall, isVideoCall]);

			if (!isConnected) {
				return <View />;
			}

			return (
				<View style={styles.containerCallDetail}>
					{!isFromNative && <StatusBarHeight />}
					<LinearGradient
						start={{ x: 1, y: 0 }}
						end={{ x: 0, y: 0 }}
						colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
						style={[StyleSheet.absoluteFillObject]}
					/>
					<View style={[styles.menuHeader]}>
						<View style={styles.headerControlsLeft}>
							<TouchableOpacity
								onPress={() => {
									Alert.alert('End Call', 'Please confirm if you would like to end the call?', [
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
								<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.white} height={size.s_24} width={size.s_24} />
							</TouchableOpacity>
						</View>
						<View style={styles.headerControlsRight}>
							{callState.localStream && localMediaControl?.camera && (
								<View>
									<TouchableOpacity onPress={handleSwitchCamera} style={[styles.buttonCircle]}>
										<MezonIconCDN icon={IconCDN.cameraFront} height={size.s_24} width={size.s_24} color={themeValue.white} />
									</TouchableOpacity>
								</View>
							)}
							<View>
								<TouchableOpacity
									style={[styles.buttonCircle, localMediaControl?.camera && styles.buttonCircleActive]}
									onPress={toggleVideo}
								>
									{localMediaControl?.camera ? (
										<MezonIconCDN icon={IconCDN.videoIcon} width={size.s_24} height={size.s_24} color={themeValue.black} />
									) : (
										<MezonIconCDN icon={IconCDN.videoSlashIcon} width={size.s_24} height={size.s_24} color={themeValue.text} />
									)}
								</TouchableOpacity>
							</View>
						</View>
					</View>
					<RenderMainView
						receiverAvatarProp={receiverAvatar}
						receiverNameProp={receiverName}
						callState={callState}
						isAnswerCall={isAnswerCall}
						isConnected={isConnected}
						isMirror={isMirror}
						isOnLocalCamera={localMediaControl?.camera || false}
					/>
					<View style={[styles.menuFooter]}>
						<View>
							<TouchableOpacity onPress={toggleSpeaker} style={[styles.menuIcon, localMediaControl?.speaker && styles.menuIconActive]}>
								<MezonIconCDN
									icon={localMediaControl.speaker ? IconCDN.channelVoice : IconCDN.voiceLowIcon}
									color={localMediaControl.speaker ? themeValue.secondaryLight : themeValue.white}
								/>
							</TouchableOpacity>
							<Text style={styles.textDescControl}>{t('speaker')}</Text>
						</View>
						<View>
							<TouchableOpacity onPress={onCancelCall} style={styles.endCallButton}>
								<MezonIconCDN icon={IconCDN.phoneCallIcon} />
							</TouchableOpacity>
							<Text style={styles.textDescControl}>{t('end')}</Text>
						</View>
						<View>
							<TouchableOpacity onPress={toggleAudio} style={[styles.menuIcon, localMediaControl?.mic && styles.menuIconActive]}>
								{localMediaControl?.mic ? (
									<MezonIconCDN icon={IconCDN.microphoneIcon} width={size.s_24} height={size.s_24} color={themeValue.black} />
								) : (
									<MezonIconCDN icon={IconCDN.microphoneDenyIcon} width={size.s_24} height={size.s_24} color={themeValue.text} />
								)}
							</TouchableOpacity>
							<Text style={styles.textDescControl}>Mic</Text>
						</View>
					</View>
				</View>
			);
		}
	)
);
