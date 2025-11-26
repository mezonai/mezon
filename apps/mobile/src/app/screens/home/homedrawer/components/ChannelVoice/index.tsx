import type { TrackReference } from '@livekit/react-native';
import { AudioSession, LiveKitRoom, useConnectionState } from '@livekit/react-native';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllUserClans, selectIsPiPMode, selectVoiceInfo, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store-mobile';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, NativeModules, Platform, StatusBar, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { PERMISSIONS, request } from 'react-native-permissions';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { useSoundReactions } from '../../../../../hooks/useSoundReactions';
import { CallReactionHandler } from './CallReactionHandler';
import HeaderRoomView from './HeaderRoomView';
import RoomView from './RoomView';

const { CustomAudioModule, KeepAwake, KeepAwakeIOS, AudioSessionModule, PipModule } = NativeModules;

// Audio output types
export type AudioOutput = {
	id: string;
	name: string;
	type: 'speaker' | 'earpiece' | 'bluetooth' | 'headphones' | 'default' | 'force_speaker';
};

const ConnectionMonitor = memo(() => {
	const connectionState = useConnectionState();
	const startedRef = useRef(false);

	useEffect(() => {
		if (connectionState === 'connected' && !startedRef.current) {
			startedRef.current = true;
			startAudioCall();
		}
	}, [connectionState]);

	useEffect(() => {
		return () => {
			stopAudioCall();
		};
	}, []);

	const startAudioCall = async () => {
		if (Platform.OS === 'android') {
			await AudioSession.configureAudio({
				android: {
					audioTypeOptions: {
						forceHandleAudioRouting: true,
						manageAudioFocus: true,
						audioFocusMode: 'gainTransientMayDuck' // Allow ducking other audio
					}
				}
			});
			await CustomAudioModule.getAudioStatus((err, audioRoute) => {
				if (err) {
					console.error('error get init audio status:', err);
				} else {
					if (audioRoute === 'speaker') {
						return;
					} else {
						CustomAudioModule.setSpeaker(false, null);
					}
				}
			});
		} else {
			await AudioSession.startAudioSession();
			await AudioSession.setAppleAudioConfiguration({
				audioCategory: 'playAndRecord',
				audioCategoryOptions: [
					'allowBluetooth',
					'allowBluetoothA2DP',
					'allowAirPlay',
					'mixWithOthers',
					'duckOthers',
					'interruptSpokenAudioAndMixWithOthers'
				],
				audioMode: 'voiceChat'
			});
			await AudioSession.configureAudio({
				ios: {
					defaultOutput: 'earpiece'
				}
			});
			await AudioSessionModule?.setAudioDevice?.('earpiece');
		}
	};

	const stopAudioCall = async () => {
		if (Platform.OS === 'android') {
			CustomAudioModule.setSpeaker(false, null);
		} else {
			await AudioSessionModule.stopAudioSession();
		}
		await AudioSession.stopAudioSession();
	};

	return <View />;
});

function ChannelVoice({
	token,
	serverUrl,
	onPressMinimizeRoom,
	isAnimationComplete,
	isGroupCall = false,
	participantsCount = 0
}: {
	onPressMinimizeRoom?: () => void;
	token: string;
	serverUrl: string;
	isAnimationComplete: boolean;
	isGroupCall?: boolean;
	participantsCount?: number;
}) {
	const voiceInfo = useSelector(selectVoiceInfo);
	const { themeValue } = useTheme();
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const dispatch = useAppDispatch();
	const isRequestingPermission = useRef(false);
	const timeoutRef = useRef(null);
	const channelId = useMemo(() => {
		return voiceInfo?.channelId;
	}, [voiceInfo]);
	const allUserClans = useSelector(selectAllUserClans, (_a, _b) => true);

	const { handleSoundReaction, activeSoundReactions } = useSoundReactions();
	const clanId = useMemo(() => {
		return voiceInfo?.clanId;
	}, [voiceInfo]);

	const checkPermissions = async () => {
		if (Platform.OS === 'android') {
			try {
				isRequestingPermission.current = true;
				await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
				await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
				timeoutRef.current = setTimeout(() => {
					isRequestingPermission.current = false;
				}, 2000);
			} catch (error) {
				console.error('Permission request failed:', error);
			} finally {
				isRequestingPermission.current = false;
			}
		}
	};

	useEffect(() => {
		const handleBackPress = () => {
			if (isAnimationComplete) {
				onPressMinimizeRoom();
				return true;
			}
			return false;
		};

		const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

		return () => backHandler.remove();
	}, [isAnimationComplete]);

	useEffect(() => {
		checkPermissions();
		const activateKeepAwake = async (platform: string) => {
			try {
				if (platform === 'android') {
					await KeepAwake.activate();
				} else {
					await KeepAwakeIOS.activate();
				}
			} catch (error) {
				console.error(`Activate KeepAwake Error on ${platform}:`, error);
			}
		};

		const deactivateKeepAwake = async (platform: string) => {
			try {
				if (platform === 'android') {
					KeepAwake.deactivate();
				} else {
					KeepAwakeIOS.deactivate();
				}
			} catch (error) {
				console.error(`Deactivate KeepAwake Error on ${platform}:`, error);
			}
		};

		activateKeepAwake(Platform.OS);

		return () => {
			deactivateKeepAwake(Platform.OS);
		};
	}, []);

	const setupPipMode = async () => {
		if (Platform.OS === 'android') {
			try {
				await PipModule?.setupDefaultPipMode?.();
			} catch (error) {
				console.error('Error entering PiP mode:', error);
			}
		}
	};
	useEffect(() => {
		setupPipMode();
		const subscription =
			Platform.OS === 'ios'
				? null
				: AppState.addEventListener('change', async (state) => {
						try {
							if (isRequestingPermission?.current) {
								return;
							}
							if (state === 'background') {
								StatusBar.setHidden(true);
								StatusBar.setTranslucent(false);
								PipModule?.enterPipMode?.();
								dispatch(voiceActions.setPiPModeMobile(true));
							} else {
								StatusBar.setHidden(false);
								StatusBar.setTranslucent(true);
								PipModule?.showStatusBar?.();
								dispatch(voiceActions.setPiPModeMobile(false));
							}
						} catch (e) {
							StatusBar.setHidden(false);
							StatusBar.setTranslucent(true);
							dispatch(voiceActions.setPiPModeMobile(false));
						}
					});
		return () => {
			if (Platform.OS === 'android') {
				PipModule?.exitPipMode?.();
				PipModule?.showStatusBar?.();
				StatusBar.setHidden(false);
				StatusBar.setTranslucent(true);
				dispatch(voiceActions.setPiPModeMobile(false));
			}
			timeoutRef?.current && clearTimeout(timeoutRef.current);
			subscription && subscription.remove();
		};
	}, [dispatch]);

	return (
		<View>
			{isAnimationComplete && !focusedScreenShare && !isPiPMode && <StatusBarHeight />}
			<View
				style={[
					{
						width: isAnimationComplete ? '100%' : size.s_100 * 2,
						height: isAnimationComplete ? '100%' : size.s_150
					},
					!isAnimationComplete && {
						borderWidth: 1,
						borderColor: themeValue?.textDisabled,
						borderRadius: size.s_10,
						overflow: 'hidden'
					}
				]}
			>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFillObject]}
				/>
				<LiveKitRoom serverUrl={serverUrl} token={token} connect={true}>
					<HeaderRoomView
						channelId={channelId}
						onPressMinimizeRoom={onPressMinimizeRoom}
						isGroupCall={isGroupCall}
						isShow={isAnimationComplete && !focusedScreenShare && !isPiPMode}
					/>
					<ConnectionMonitor />
					{!isGroupCall && !isPiPMode && isAnimationComplete && (
						<CallReactionHandler
							channelId={channelId}
							isAnimatedCompleted={isAnimationComplete}
							onSoundReaction={handleSoundReaction}
							allUserClans={allUserClans}
						/>
					)}
					<RoomView
						channelId={channelId}
						clanId={clanId}
						onPressMinimizeRoom={onPressMinimizeRoom}
						isAnimationComplete={isAnimationComplete}
						onFocusedScreenChange={setFocusedScreenShare}
						isGroupCall={isGroupCall}
						participantsCount={participantsCount}
						activeSoundReactions={activeSoundReactions}
						allUserClans={allUserClans}
					/>
				</LiveKitRoom>
			</View>
		</View>
	);
}

export default React.memo(ChannelVoice);
