import { AndroidAudioTypePresets, AudioSession, LiveKitRoom, TrackReference } from '@livekit/react-native';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById2, selectIsPiPMode, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store-mobile';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import React, { useEffect, useState } from 'react';
import { AppState, Dimensions, NativeModules, Platform, Text, TouchableOpacity, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
import RoomView from './RoomView';
import { style } from './styles';

const { width, height } = Dimensions.get('window');

function ChannelVoice({
	channelId,
	clanId,
	token,
	serverUrl,
	onPressMinimizeRoom,
	isAnimationComplete
}: {
	channelId: string;
	clanId: string;
	onPressMinimizeRoom?: () => void;
	token: string;
	serverUrl: string;
	isAnimationComplete: boolean;
}) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const channel = useAppSelector((state) => selectChannelById2(state, channelId));
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const dispatch = useAppDispatch();
	useKeepAwake();

	useEffect(() => {
		startAudioCall();

		return () => {
			stopAudioCall();
		};
	}, []);

	const startAudioCall = async () => {
		await AudioSession.configureAudio({
			android: {
				audioTypeOptions: AndroidAudioTypePresets.communication
			}
		});
		await AudioSession.startAudioSession();
		InCallManager.start({ media: 'audio' });
	};

	const stopAudioCall = async () => {
		InCallManager.stop();
		await AudioSession.stopAudioSession();
	};

	const onToggleSpeaker = async () => {
		InCallManager.setSpeakerphoneOn(!isSpeakerOn);
		setIsSpeakerOn(!isSpeakerOn);
	};

	useEffect(() => {
		const subscription = AppState.addEventListener('change', (state) => {
			if (state === 'background') {
				if (Platform.OS === 'android') {
					NativeModules.PipModule.enablePipMode();
				} else {
					// 	do something for ios
				}
				dispatch(voiceActions.setPiPModeMobile(true));
			} else {
				dispatch(voiceActions.setPiPModeMobile(false));
			}
		});
		return () => {
			dispatch(voiceActions.setPiPModeMobile(false));
			subscription.remove();
		};
	}, [dispatch]);

	return (
		<View>
			<StatusBarHeight />
			<View
				style={{
					width: isAnimationComplete ? width : size.s_100 * 2,
					height: isAnimationComplete ? height : size.s_150,
					backgroundColor: themeValue?.primary
				}}
			>
				{isAnimationComplete && !focusedScreenShare && !isPiPMode && (
					<View style={[styles.menuHeader]}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20, flexGrow: 1, flexShrink: 1 }}>
							<TouchableOpacity onPress={onPressMinimizeRoom} style={styles.buttonCircle}>
								<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} />
							</TouchableOpacity>
							<Text numberOfLines={1} style={[styles.text, { flexGrow: 1, flexShrink: 1 }]}>
								{channel?.channel_label}
							</Text>
						</View>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20, flexGrow: 1, flexShrink: 1 }}>
							<TouchableOpacity
								onPress={() => onToggleSpeaker()}
								style={[styles.buttonCircle, isSpeakerOn && styles.buttonCircleActive]}
							>
								<MezonIconCDN
									icon={isSpeakerOn ? IconCDN.channelVoice : IconCDN.voiceLowIcon}
									height={size.s_17}
									width={isSpeakerOn ? size.s_17 : size.s_20}
									color={isSpeakerOn ? themeValue.border : themeValue.white}
								/>
							</TouchableOpacity>
						</View>
					</View>
				)}
				<LiveKitRoom serverUrl={serverUrl} token={token} connect={true}>
					<RoomView
						channelId={channelId}
						clanId={clanId}
						onPressMinimizeRoom={onPressMinimizeRoom}
						isAnimationComplete={isAnimationComplete}
						onFocusedScreenChange={setFocusedScreenShare}
					/>
				</LiveKitRoom>
			</View>
		</View>
	);
}

export default React.memo(ChannelVoice);
