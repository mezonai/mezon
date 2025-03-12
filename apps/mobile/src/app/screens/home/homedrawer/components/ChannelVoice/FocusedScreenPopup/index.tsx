import { VideoTrack } from '@livekit/react-native';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { selectMemberClanByUserName } from '@mezon/store-mobile';
import { Track } from 'livekit-client';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import { style } from '../styles';

const FocusedScreenPopup = ({ sortedParticipants, tracks, localParticipant }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const otherParticipants = sortedParticipants.filter((p) => p.identity !== localParticipant.identity);
	const selfParticipant = sortedParticipants.find((p) => p.identity === localParticipant.identity);
	const randomParticipant = sortedParticipants[0];
	const username = randomParticipant.identity;
	const member = useAppSelector((state) => selectMemberClanByUserName(state, username));
	const voiceUsername = member?.clan_nick || member?.user?.display_name || username;
	const avatar = useMemo(() => {
		return member?.clan_avatar || member?.user?.avatar_url || 'assets/images/mezon-logo-white.svg';
	}, [member]);

	const screenShareOther = otherParticipants.find((p) => p.isScreenShareEnabled);
	if (screenShareOther) {
		const screenTrackRef = tracks.find((t) => t.participant.identity === screenShareOther.identity && t.source === Track.Source.ScreenShare);
		if (screenTrackRef) {
			return (
				<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<View style={{ height: size.s_150, width: '100%', alignSelf: 'center' }}>
						<VideoTrack trackRef={screenTrackRef} style={{ height: size.s_150, width: '100%', alignSelf: 'center' }} />
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
						<VideoTrack trackRef={selfScreenTrackRef} style={{ height: size.s_150, width: '100%', alignSelf: 'center' }} />
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
						<VideoTrack trackRef={videoTrackRef} style={{ height: 100, width: '100%', alignSelf: 'center' }} />
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
						<VideoTrack trackRef={videoTrackRef} style={{ height: 100, width: '100%', alignSelf: 'center' }} />
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
						<Icons.MicrophoneIcon height={size.s_14} />
					) : (
						<Icons.MicrophoneSlashIcon height={size.s_14} />
					)}
					<Text style={styles.subTitle}>{voiceUsername || 'Unknown'}</Text>
				</View>
			</View>
		);
	}

	return null;
};

export default React.memo(FocusedScreenPopup);
