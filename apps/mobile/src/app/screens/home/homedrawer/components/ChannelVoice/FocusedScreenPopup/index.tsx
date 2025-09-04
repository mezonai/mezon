import { useLocalParticipant, useParticipants, useTracks, VideoTrack } from '@livekit/react-native';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserName, useAppSelector } from '@mezon/store-mobile';
import { Track } from 'livekit-client';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import { style } from '../styles';

const FocusedScreenPopup = () => {
	const { localParticipant } = useLocalParticipant();
	const participants = useParticipants();
	const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.ScreenShareAudio]);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const otherParticipants = participants.filter((p) => p.identity !== localParticipant.identity);
	const selfParticipant = participants.find((p) => p.identity === localParticipant.identity);
	const randomParticipant = participants[0];
	const username = randomParticipant.identity;
	const member = useAppSelector((state) => selectMemberClanByUserName(state, username));
	const voiceUsername = member?.clan_nick || member?.user?.display_name || username;
	const avatar = useMemo(() => {
		return member?.clan_avatar || member?.user?.avatar_url || '';
	}, [member]);

	const screenShareOther = otherParticipants.find((p) => p.isScreenShareEnabled);
	if (screenShareOther) {
		const screenTrackRef = tracks.find((t) => t.participant.identity === screenShareOther.identity && t.source === Track.Source.ScreenShare);
		if (screenTrackRef) {
			return (
				<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<View style={{ height: size.s_150, width: '100%', alignSelf: 'center' }}>
						<VideoTrack
							objectFit="contain"
							trackRef={screenTrackRef}
							style={{ height: size.s_150, width: '100%', alignSelf: 'center' }}
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
				<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<View style={{ height: size.s_150, width: '100%', alignSelf: 'center' }}>
						<VideoTrack
							trackRef={selfScreenTrackRef}
							style={{ height: size.s_150, width: '100%', alignSelf: 'center' }}
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
				<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<View style={{ height: size.s_150, width: '100%', alignSelf: 'center' }}>
						<VideoTrack
							trackRef={videoTrackRef}
							style={{ height: 100, width: '100%', alignSelf: 'center' }}
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
				<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<View style={{ height: 100, width: '100%', alignSelf: 'center' }}>
						<VideoTrack
							trackRef={videoTrackRef}
							style={{ height: 100, width: '100%', alignSelf: 'center' }}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
					</View>
				</View>
			);
		}
	}

	if (randomParticipant) {
		return (
			<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
					<MezonAvatar width={size.s_50} height={size.s_50} username={voiceUsername} avatarUrl={avatar} />
				</View>
				<View style={[styles.userName, { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
					{randomParticipant.isMicrophoneEnabled ? (
						<MezonIconCDN icon={IconCDN.microphoneIcon} height={size.s_14} color={themeValue.text} />
					) : (
						<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_14} color={themeValue.text} />
					)}
					<Text style={styles.subTitle}>{voiceUsername || 'Unknown'}</Text>
				</View>
			</View>
		);
	}

	return null;
};

export default React.memo(FocusedScreenPopup);
