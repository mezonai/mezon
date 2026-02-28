import { useLocalParticipant, useParticipants, useTracks, VideoTrack } from '@livekit/react-native';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberByIdAndClanId, useAppSelector } from '@mezon/store-mobile';
import { RoomEvent, Track } from 'livekit-client';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from '../styles';

const FocusedScreenPopup = ({ clanId }: { clanId: string }) => {
	const { localParticipant } = useLocalParticipant();
	const participants = useParticipants();
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.Microphone, withPlaceholder: false },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
			{ source: Track.Source.ScreenShareAudio, withPlaceholder: false }
		],
		{ updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
	);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const otherParticipants = participants.filter((p) => p.identity !== localParticipant.identity);
	const selfParticipant = participants.find((p) => p.identity === localParticipant.identity);
	const randomParticipant = participants[0];
	const identity = randomParticipant.identity;
	const member = useAppSelector((state) => selectMemberByIdAndClanId(state, clanId, identity));
	const voiceUsername = member?.clan_nick || member?.user?.display_name || member?.user?.username || '';
	const avatar = useMemo(() => {
		return member?.clan_avatar || member?.user?.avatar_url || '';
	}, [member]);

	const screenShareOther = otherParticipants.find((p) => p.isScreenShareEnabled);
	if (screenShareOther) {
		const screenTrackRef = tracks.find((t) => t.participant.identity === screenShareOther.identity && t.source === Track.Source.ScreenShare);
		if (screenTrackRef) {
			return (
				<View style={styles.focusedContainer}>
					<View style={styles.focusedVideoWrapper}>
						<VideoTrack
							objectFit="contain"
							trackRef={screenTrackRef}
							style={styles.focusedVideoStyle}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
					</View>
				</View>
			);
		}
	}

	if (selfParticipant?.isScreenShareEnabled) {
		const selfScreenTrackRef = tracks.find((t) => t.participant.identity === selfParticipant.identity && t.source === Track.Source.ScreenShare);
		if (selfScreenTrackRef) {
			return (
				<View style={styles.focusedContainer}>
					<View style={styles.focusedVideoWrapper}>
						<VideoTrack
							trackRef={selfScreenTrackRef}
							style={styles.focusedVideoStyle}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
					</View>
				</View>
			);
		}
	}

	const cameraOther = otherParticipants.find((p) => p.isCameraEnabled);
	if (cameraOther) {
		const videoTrackRef = tracks.find((t) => t.participant.identity === cameraOther.identity && t.source === Track.Source.Camera);
		if (videoTrackRef) {
			return (
				<View style={styles.focusedContainer}>
					<View style={styles.focusedVideoWrapper}>
						<VideoTrack
							trackRef={videoTrackRef}
							style={styles.focusedVideoStyleSmall}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
					</View>
				</View>
			);
		}
	}

	if (selfParticipant?.isCameraEnabled) {
		const videoTrackRef = tracks.find((t) => t.participant.identity === selfParticipant.identity && t.source === Track.Source.Camera);
		if (videoTrackRef) {
			return (
				<View style={styles.focusedContainer}>
					<View style={styles.focusedVideoWrapperSmall}>
						<VideoTrack
							trackRef={videoTrackRef}
							style={styles.focusedVideoStyleSmall}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
					</View>
				</View>
			);
		}
	}

	if (randomParticipant) {
		return (
			<View style={styles.focusedContainer}>
				<View style={styles.focusedAvatarWrapper}>
					<MezonAvatar width={size.s_50} height={size.s_50} username={voiceUsername} avatarUrl={avatar} />
				</View>
				<View style={[styles.userName, styles.focusedUsernameWrapper]}>
					{randomParticipant.isMicrophoneEnabled ? (
						<MezonIconCDN icon={IconCDN.microphoneIcon} height={size.s_14} color={themeValue.text} />
					) : (
						<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_14} color={themeValue.text} />
					)}
					<Text style={styles.subTitle} numberOfLines={1}>
						{voiceUsername || 'Unknown'}
					</Text>
				</View>
			</View>
		);
	}

	return null;
};

export default React.memo(FocusedScreenPopup);
