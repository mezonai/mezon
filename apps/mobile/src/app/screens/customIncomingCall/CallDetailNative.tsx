import { size, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, selectAllAccount, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { IMessageTypeCallLog } from '@mezon/utils';
import { WebrtcSignalingType } from 'mezon-js';
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, NativeModules, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { Icons } from '../../componentUI/MobileIcons';
import { IconCDN } from '../../constants/icon_cdn';
import { useWebRTCCallMobile } from '../../hooks/useWebRTCCallMobile';
import { clearOngoingCallNotification, showOngoingCallNotification } from '../../utils/ongoingCallNotification';
import { RenderMainView } from '../messages/DirectMessageCall/RenderMainView';
import { style } from './styles';

interface IDirectMessageCallProps {
	isVideoCall?: boolean;
	receiverId: string;
	isInCall: boolean;
	directMessageId: string;
	receiverAvatar: string;
	receiverName: string;
	onIsConnected?: () => void;
}

export interface CallDetailNativeRef {
	handleOffer: () => Promise<void>;
}

const maxRetries = 10;
const retryDelayMs = 500;
export const CallDetailNative = memo(
	forwardRef<CallDetailNativeRef, IDirectMessageCallProps>(
		({ isVideoCall = false, directMessageId, receiverId, isInCall, onIsConnected, receiverName, receiverAvatar }, ref) => {
			const { themeValue } = useTheme();
			const dispatch = useAppDispatch();
			const styles = style(themeValue);
			const userProfile = useSelector(selectAllAccount);
			const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userProfile?.user?.id || ''));
			const [isMirror, setIsMirror] = useState<boolean>(true);
			const { t } = useTranslation(['dmMessage']);

			const {
				callState,
				localMediaControl,
				timeStartConnected,
				isConnected,
				offerCache,
				startCall,
				handleEndCall,
				toggleSpeaker,
				toggleAudio,
				toggleVideo,
				handleSignalingMessage,
				switchCamera,
				handleToggleIsConnected,
				handleOffer
			} = useWebRTCCallMobile({
				dmUserId: receiverId,
				userId: userProfile?.user?.id as string,
				channelId: directMessageId as string,
				isVideoCall,
				isFromNative: true,
				callerName: userProfile?.user?.username,
				callerAvatar: userProfile?.user?.avatar_url
			});

			const retryCountRef = useRef<number>(0);
			const offerCacheRef = useRef(offerCache);
			const ongoingNotificationIdRef = useRef<string | null>(null);
			const hasStartedCallRef = useRef<boolean>(false);

			useEffect(() => {
				offerCacheRef.current = offerCache;
			}, [offerCache]);

			useEffect(() => {
				if (isConnected && onIsConnected) {
					onIsConnected();
				}
			}, [isConnected, onIsConnected]);

			const handleOfferWithRetry = useCallback(async () => {
				const executePush = async (attempt: number): Promise<void> => {
					const currentOfferCache = offerCacheRef.current;
					if (currentOfferCache) {
						await handleOffer(currentOfferCache);
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
			}, [handleOffer]);

			useImperativeHandle(
				ref,
				() => ({
					handleOffer: handleOfferWithRetry
				}),
				[handleOfferWithRetry]
			);

			const clearOngoingNotification = useCallback(async () => {
				if (!ongoingNotificationIdRef.current) return;

				await clearOngoingCallNotification(ongoingNotificationIdRef.current);
				ongoingNotificationIdRef.current = null;
			}, []);

			const showOngoingNotification = useCallback(async () => {
				if (!isConnected) return;

				const notificationId = await showOngoingCallNotification({
					directMessageId,
					receiverId,
					receiverName,
					receiverAvatar,
					isVideoCall,
					startedAt: timeStartConnected?.current ? new Date(timeStartConnected.current).getTime() : undefined,
					pressActivity: 'com.mezon.mobile.CallActivity'
				});

				if (notificationId) {
					ongoingNotificationIdRef.current = notificationId;
				}
			}, [directMessageId, isConnected, isVideoCall, receiverAvatar, receiverId, receiverName, timeStartConnected]);

			useEffect(() => {
				if (isConnected) {
					showOngoingNotification();
				} else {
					clearOngoingNotification();
				}

				return () => {
					clearOngoingNotification();
				};
			}, [clearOngoingNotification, isConnected, showOngoingNotification]);

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
							InCallManager.stop();
							NativeModules?.DeviceUtils?.killApp();
							BackHandler.exitApp();
							return;
						}
					}
				}

				if (lastSignalingData) {
					handleSignalingMessage(lastSignalingData);
				}
			}, [dispatch, directMessageId, handleEndCall, handleSignalingMessage, isVideoCall, signalingData, timeStartConnected]);

			useEffect(() => {
				if (hasStartedCallRef.current) return;
				hasStartedCallRef.current = true;

				dispatch(DMCallActions.setIsInCall(true));
				InCallManager.start({ media: 'audio' });
				handleToggleIsConnected(false);
				startCall(isVideoCall, true);

				return () => {
					InCallManager.stop();
				};
			}, [dispatch, handleToggleIsConnected, isVideoCall, startCall]);

			if (!isConnected && !isInCall) {
				return <View />;
			}

			return (
				<View style={styles.containerCallDetail}>
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
						isAnswerCall={true}
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
								<Icons.CallIcon color={themeValue.white} width={size.s_24} height={size.s_24} />
							</TouchableOpacity>
							<Text style={styles.textDescControl}>{t('end')}</Text>
						</View>
						<View>
							<TouchableOpacity onPress={toggleAudio} style={[styles.menuIcon, localMediaControl?.mic && styles.menuIconActive]}>
								{localMediaControl?.mic ? (
									<Icons.MicIcon color={themeValue.black} width={size.s_18} height={size.s_24} />
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
