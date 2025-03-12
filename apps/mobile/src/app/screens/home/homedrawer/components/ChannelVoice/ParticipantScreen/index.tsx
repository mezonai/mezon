import { VideoTrack } from '@livekit/react-native';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { selectMemberClanByUserName } from '@mezon/store-mobile';
import { Track } from 'livekit-client';
import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { style } from '../styles';

const ParticipantItem = ({ participant, tracks, isFocusedScreen, setFocusedScreenShare, isGridLayout }) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const username = participant.identity;
	const member = useAppSelector((state) => selectMemberClanByUserName(state, username));
	const voiceUsername = member?.clan_nick || member?.user?.display_name || username;
	const avatar = useMemo(() => {
		return member?.clan_avatar || member?.user?.avatar_url || 'assets/images/mezon-logo-white.svg';
	}, [member]);

	const videoTrackRef = tracks.find(
		(t) => t.participant.identity === participant.identity && t.source === Track.Source.Camera && t.participant.isCameraEnabled === true
	);

	const screenTrackRef = tracks.find((t) => t.participant.identity === participant.identity && t.source === Track.Source.ScreenShare);

	const isParticipantFocused = isFocusedScreen === screenTrackRef;

	const handleFocusScreen = () => {
		setFocusedScreenShare(isParticipantFocused ? null : screenTrackRef);
	};

	const isLoading = !member;

	return (
		<>
			{screenTrackRef && (
				<View
					style={[
						styles.userView,
						!isGridLayout ? { width: '100%', height: size.s_150 + size.s_100 } : { width: '48%', height: size.s_150 },
						isTabletLandscape && { height: size.s_150 + size.s_100 }
					]}
				>
					<VideoTrack trackRef={screenTrackRef} style={styles.participantView} />
					<View style={[styles.userName, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
						<Icons.ShareScreenIcon height={size.s_14} />
						<Text
							numberOfLines={1}
							ellipsizeMode="tail"
							style={[styles.subTitle, isParticipantFocused ? { width: '100%' } : { width: '48%' }]}
						>
							{voiceUsername} {isParticipantFocused && `(Share Screen)`}
						</Text>
					</View>
					<TouchableOpacity style={styles.focusIcon} onPress={handleFocusScreen}>
						{isParticipantFocused ? <Icons.CloseIcon height={size.s_14} /> : <Icons.ArrowSaltIcon height={size.s_14} />}
					</TouchableOpacity>
				</View>
			)}

			{videoTrackRef && (
				<View
					style={[
						styles.userView,
						isGridLayout && { width: '48%', height: size.s_150 },
						isTabletLandscape && { height: size.s_150 + size.s_100 }
					]}
				>
					<VideoTrack trackRef={videoTrackRef} style={styles.participantView} />
					<View style={[styles.userName, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
						{participant.isMicrophoneEnabled ? (
							<Icons.MicrophoneIcon height={size.s_14} />
						) : (
							<Icons.MicrophoneSlashIcon height={size.s_14} />
						)}
						<Text style={styles.subTitle}>{voiceUsername || 'Unknown'}</Text>
					</View>
				</View>
			)}

			{!videoTrackRef && (
				<View
					style={[
						styles.userView,
						isGridLayout && { width: '48%', height: size.s_150 },
						isTabletLandscape && { height: size.s_150 + size.s_100 }
					]}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: size.s_10 }}>
						{isLoading ? (
							<Icons.LoadingIcon width={24} height={24} />
						) : (
							<MezonAvatar width={size.s_50} height={size.s_50} username={voiceUsername} avatarUrl={avatar} />
						)}
					</View>
					<View style={[styles.userName, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
						{participant.isMicrophoneEnabled ? (
							<Icons.MicrophoneIcon height={size.s_14} />
						) : (
							<Icons.MicrophoneSlashIcon height={size.s_14} />
						)}
						{isLoading ? <Icons.LoadingIcon width={24} height={24} /> : <Text style={styles.subTitle}>{voiceUsername || 'Unknown'}</Text>}
					</View>
				</View>
			)}
		</>
	);
};

const ParticipantScreen = ({ sortedParticipants, tracks, isFocusedScreen, setFocusedScreenShare }) => {
	const isTabletLandscape = useTabletLandscape();

	const videoTrackCount = sortedParticipants.reduce((count, participant) => {
		if (participant.isScreenShareEnabled) count += 1;
		if (participant.isCameraEnabled || participant.isScreenShareEnabled) count += 1;
		else count += 1;
		return count;
	}, 0);

	const isGridLayout = videoTrackCount >= 3;

	return (
		<View style={{ marginBottom: isTabletLandscape ? '5%' : '30%' }}>
			<ScrollView
				style={{ marginHorizontal: size.s_10 }}
				contentContainerStyle={
					isGridLayout
						? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: size.s_10, alignItems: 'center' }
						: { gap: size.s_10 }
				}
			>
				{sortedParticipants.map((participant) => (
					<ParticipantItem
						key={participant.identity}
						participant={participant}
						tracks={tracks}
						isFocusedScreen={isFocusedScreen}
						setFocusedScreenShare={setFocusedScreenShare}
						isGridLayout={isGridLayout}
					/>
				))}
			</ScrollView>
		</View>
	);
};

export default React.memo(ParticipantScreen);
