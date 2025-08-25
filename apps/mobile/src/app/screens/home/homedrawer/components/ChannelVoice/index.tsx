import { AudioSession, LiveKitRoom, TrackReference, useConnectionState } from '@livekit/react-native';
import { size, useTheme } from '@mezon/mobile-ui';
import { getStore, selectChannelById2, selectIsPiPMode, selectVoiceInfo, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store-mobile';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, NativeModules, Platform, View } from 'react-native';
import { PERMISSIONS, request } from 'react-native-permissions';
import { useSelector } from 'react-redux';
import { ReactionChannelInfo } from '../../../../../../../../../libs/components/src/lib/components/VoiceChannel/MyVideoConference/Reaction/types';
import { useSendReaction } from '../../../../../../../../../libs/components/src/lib/components/VoiceChannel/MyVideoConference/Reaction/useSendReaction';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { useSoundReactions } from '../../../../../hooks/useSoundReactions';
import { CallReactionHandler } from './CallReactionHandler';
import HeaderRoomView from './HeaderRoomView';
import RoomView from './RoomView';

const { CustomAudioModule, KeepAwake, KeepAwakeIOS, AudioSessionModule } = NativeModules;

// Audio output types
export type AudioOutput = {
	id: string;
	name: string;
	type: 'speaker' | 'earpiece' | 'bluetooth' | 'headphones' | 'default' | 'force_speaker';
};

const ConnectionMonitor = memo(() => {
	const connectionState = useConnectionState();

	useEffect(() => {
		if (connectionState === 'connected') {
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
	const channelId = useMemo(() => {
		return voiceInfo?.channelId;
	}, [voiceInfo]);
	const currentChannel = useMemo(() => {
		const store = getStore();
		const channel = selectChannelById2(store.getState(), channelId);
		return channel;
	}, [channelId]);
	const { sendSoundReaction } = useSendReaction({ currentChannel: currentChannel as ReactionChannelInfo });
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
			} catch (error) {
				console.error('Permission request failed:', error);
			} finally {
				isRequestingPermission.current = false;
			}
		}
	};

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

	useEffect(() => {
		const subscription = AppState.addEventListener('change', async (state) => {
			if (isRequestingPermission?.current || Platform.OS === 'ios') {
				return;
			}
			if (state === 'background') {
				if (Platform.OS === 'android') {
					const isPipSupported = await NativeModules.PipModule.isPipSupported();
					if (isPipSupported) {
						NativeModules.PipModule.enablePipMode();
						dispatch(voiceActions.setPiPModeMobile(true));
					}
				}
			} else {
				if (Platform.OS === 'android') {
					dispatch(voiceActions.setPiPModeMobile(false));
				}
			}
		});
		return () => {
			if (Platform.OS === 'android') {
				dispatch(voiceActions.setPiPModeMobile(false));
			}
			subscription.remove();
		};
	}, [dispatch]);

	if (!voiceInfo) {
		return null;
	}

	return (
		<View>
			{isAnimationComplete && !focusedScreenShare && !isPiPMode && <StatusBarHeight />}
			<View
				style={[
					{
						width: isAnimationComplete ? '100%' : size.s_100 * 2,
						height: isAnimationComplete ? '100%' : size.s_150,
						backgroundColor: isAnimationComplete ? themeValue?.primary : themeValue?.secondary
					},
					!isAnimationComplete && {
						borderWidth: 1,
						borderColor: themeValue?.textDisabled,
						borderRadius: size.s_10,
						overflow: 'hidden'
					}
				]}
			>
				<LiveKitRoom serverUrl={serverUrl} token={token} connect={true}>
					<HeaderRoomView
						channelId={channelId}
						clanId={clanId}
						onPressMinimizeRoom={onPressMinimizeRoom}
						isGroupCall={isGroupCall}
						isShow={isAnimationComplete && !focusedScreenShare && !isPiPMode}
						sendSoundReaction={sendSoundReaction}
					/>
					<ConnectionMonitor />
					{!isGroupCall && !isPiPMode && isAnimationComplete && (
						<CallReactionHandler channelId={channelId} isAnimatedCompleted={isAnimationComplete} onSoundReaction={handleSoundReaction} />
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
					/>
				</LiveKitRoom>
			</View>
		</View>
	);
}

export default React.memo(ChannelVoice);
