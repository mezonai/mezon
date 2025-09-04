import { useParticipants, useTracks, VideoTrack } from '@livekit/react-native';
import { size, useTheme } from '@mezon/mobile-ui';
import { getStore, selectIsPiPMode, selectMemberClanByUserName, useAppSelector } from '@mezon/store-mobile';
import { Track } from 'livekit-client';
import React, { memo, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { style } from '../styles';

const ParticipantItem = memo(
	({ username, isMicrophoneEnabled, isSpeaking, screenTrackRef, videoTrackRef, setFocusedScreenShare, activeSoundReactions }: any) => {
		const isTabletLandscape = useTabletLandscape();
		const store = getStore();
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const member = useMemo(() => {
			return selectMemberClanByUserName(store.getState(), username);
		}, [username]);

		const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
		const voiceUsername = member?.clan_nick || member?.user?.display_name || username;
		const avatar = useMemo(() => {
			return member?.clan_avatar || member?.user?.avatar_url || '';
		}, [member]);

		const handleFocusScreen = () => {
			setFocusedScreenShare(screenTrackRef);
		};

		const hasActiveSoundReaction = useMemo(() => {
			const activeSoundReaction = activeSoundReactions?.get(username);
			return Boolean(activeSoundReaction);
		}, [activeSoundReactions, username]);

		const renderSoundEffectIcon = () => {
			return (
				<View style={styles.soundEffectIcon}>
					<MezonIconCDN icon={IconCDN.activityIcon} height={size.s_16} width={size.s_16} color={themeValue.textStrong} />
				</View>
			);
		};

		return (
			<>
				{screenTrackRef && (
					<TouchableOpacity
						onPress={handleFocusScreen}
						style={[
							styles.userView,
							isTabletLandscape && { height: size.s_150 + size.s_100 },
							isPiPMode && {
								width: '100%',
								height: size.s_100 * 1.2,
								marginBottom: size.s_100
							}
						]}
					>
						<VideoTrack
							objectFit={'contain'}
							trackRef={screenTrackRef}
							style={styles.participantView}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
						{!isPiPMode && hasActiveSoundReaction && renderSoundEffectIcon()}
						{!isPiPMode && (
							<View style={[styles.userName, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '90%' }]}>
								<MezonIconCDN icon={IconCDN.shareScreenIcon} height={size.s_14} />
								<Text numberOfLines={1} ellipsizeMode="tail" style={[styles.subTitle, { width: '100%' }]}>
									{voiceUsername} Share Screen
								</Text>
							</View>
						)}
						{!isPiPMode && (
							<View style={[styles.focusIcon, styles.focusIconAbsolute]}>
								<MezonIconCDN icon={IconCDN.expandIcon} height={size.s_14} color={themeValue.white} />
							</View>
						)}
					</TouchableOpacity>
				)}

				{videoTrackRef && (
					<View
						style={[
							styles.userView,
							isTabletLandscape && { height: size.s_150 + size.s_100 },
							isPiPMode && { height: size.s_60 * 2, width: '45%', marginHorizontal: size.s_4 },
							isSpeaking && { borderWidth: 1, borderColor: themeValue.textLink }
						]}
					>
						<VideoTrack
							trackRef={videoTrackRef}
							style={styles.participantView}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
						{hasActiveSoundReaction && renderSoundEffectIcon()}
						<View style={[styles.userName, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
							{isMicrophoneEnabled ? (
								<MezonIconCDN icon={IconCDN.microphoneIcon} height={size.s_14} color={themeValue.text} />
							) : (
								<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_14} color={themeValue.text} />
							)}
							<Text style={styles.subTitle}>{voiceUsername || 'Unknown'}</Text>
						</View>
					</View>
				)}

				{!videoTrackRef && (
					<View
						style={[
							styles.userView,
							isTabletLandscape && { height: size.s_150 + size.s_100 },
							isPiPMode && { height: size.s_60 * 2, width: '45%', marginHorizontal: size.s_4 },
							isSpeaking && { borderWidth: 1, borderColor: themeValue.textLink }
						]}
					>
						{hasActiveSoundReaction && renderSoundEffectIcon()}
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: size.s_10 }}>
							{!voiceUsername ? (
								<MezonIconCDN icon={IconCDN.loadingIcon} width={24} height={24} />
							) : (
								<MezonAvatar width={size.s_50} height={size.s_50} username={voiceUsername} avatarUrl={avatar} />
							)}
						</View>
						{!isPiPMode && (
							<View style={styles.wrapperUser}>
								{isMicrophoneEnabled ? (
									<MezonIconCDN icon={IconCDN.microphoneIcon} height={size.s_14} color={themeValue.text} />
								) : (
									<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_14} color={themeValue.text} />
								)}
								{!voiceUsername ? (
									<MezonIconCDN icon={IconCDN.loadingIcon} width={24} height={24} />
								) : (
									<Text numberOfLines={1} style={styles.subTitle}>
										{voiceUsername || 'Unknown'}
									</Text>
								)}
							</View>
						)}
					</View>
				)}
			</>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps?.username === nextProps?.username &&
			prevProps?.isMicrophoneEnabled === nextProps?.isMicrophoneEnabled &&
			prevProps?.isSpeaking === nextProps?.isSpeaking &&
			prevProps?.videoTrackRef === nextProps?.videoTrackRef &&
			prevProps?.screenTrackRef === nextProps?.screenTrackRef &&
			prevProps?.activeSoundReactions === nextProps?.activeSoundReactions
		);
	}
);

const ParticipantScreen = ({ setFocusedScreenShare, activeSoundReactions }) => {
	const participants = useParticipants();
	const sortedParticipants = useMemo(() => {
		return [...participants].sort((a, b) => {
			const aScreenShare = a.isScreenShareEnabled ? 1 : 0;
			const bScreenShare = b.isScreenShareEnabled ? 1 : 0;
			let aSpeaking = 0;
			let bSpeaking = 0;
			if (participants?.length > 8) {
				aSpeaking = a.isSpeaking ? 1 : 0;
				bSpeaking = b.isSpeaking ? 1 : 0;
			}

			if (aScreenShare !== bScreenShare) {
				return bScreenShare - aScreenShare;
			}
			return bSpeaking - aSpeaking;
		});
	}, [participants]);

	const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.ScreenShareAudio]);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));

	return (
		<ScrollView
			style={{ marginHorizontal: isPiPMode ? 0 : size.s_10 }}
			showsVerticalScrollIndicator={false}
			removeClippedSubviews={true}
			scrollEventThrottle={16}
			decelerationRate="fast"
			overScrollMode="never"
			maintainVisibleContentPosition={{
				minIndexForVisible: 0,
				autoscrollToTopThreshold: 10
			}}
			keyboardShouldPersistTaps="handled"
			automaticallyAdjustContentInsets={false}
			automaticallyAdjustKeyboardInsets={false}
		>
			<View
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: isPiPMode ? 'space-between' : 'center',
					gap: isPiPMode ? size.s_2 : size.s_10,
					alignItems: isPiPMode ? 'flex-start' : 'center'
				}}
			>
				{sortedParticipants?.length > 0 &&
					sortedParticipants?.map((participant) => {
						const isSpeaking = participant?.isSpeaking;
						const isMicrophoneEnabled = participant?.isMicrophoneEnabled;
						const videoTrackRef = tracks.find(
							(t) =>
								t.participant.identity === participant.identity &&
								t.source === Track.Source.Camera &&
								t.participant.isCameraEnabled === true
						);

						const screenTrackRef = tracks.find(
							(t) => t.participant.identity === participant.identity && t.source === Track.Source.ScreenShare
						);

						return (
							<ParticipantItem
								key={participant.identity}
								username={participant.identity}
								participant={participant}
								isSpeaking={isSpeaking}
								isMicrophoneEnabled={isMicrophoneEnabled}
								videoTrackRef={videoTrackRef}
								screenTrackRef={screenTrackRef}
								tracks={tracks}
								setFocusedScreenShare={setFocusedScreenShare}
								activeSoundReactions={activeSoundReactions}
							/>
						);
					})}
			</View>
			<View style={{ height: size.s_300 }} />
		</ScrollView>
	);
};

export default React.memo(ParticipantScreen);
