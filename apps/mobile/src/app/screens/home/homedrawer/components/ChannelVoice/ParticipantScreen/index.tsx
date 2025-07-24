import { useTracks, VideoTrack } from '@livekit/react-native';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectIsPiPMode, selectMemberClanByUserName, useAppSelector } from '@mezon/store-mobile';
import { Track } from 'livekit-client';
import React, { useMemo } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { style } from '../styles';

const ParticipantItem = ({ participant, tracks, setFocusedScreenShare, isGridLayout }) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const username = participant.identity;
	const member = useAppSelector((state) => selectMemberClanByUserName(state, username));
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const voiceUsername = member?.clan_nick || member?.user?.display_name || username;
	const avatar = useMemo(() => {
		return member?.clan_avatar || member?.user?.avatar_url || 'assets/images/mezon-logo-white.svg';
	}, [member]);

	const videoTrackRef = tracks.find(
		(t) => t.participant.identity === participant.identity && t.source === Track.Source.Camera && t.participant.isCameraEnabled === true
	);

	const screenTrackRef = tracks.find((t) => t.participant.identity === participant.identity && t.source === Track.Source.ScreenShare);

	const handleFocusScreen = () => {
		setFocusedScreenShare(screenTrackRef);
	};

	const isLoading = !member;
	return (
		<>
			{screenTrackRef && (
				<TouchableOpacity
					onPress={handleFocusScreen}
					style={[
						styles.userView,
						!isGridLayout ? { width: '100%', height: size.s_150 + size.s_100 } : { width: '48%', height: size.s_150 },
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
					{!isPiPMode && (
						<View style={[styles.userName, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '90%' }]}>
							<Icons.ShareScreenIcon height={size.s_14} />
							<Text numberOfLines={1} ellipsizeMode="tail" style={[styles.subTitle, { width: '100%' }]}>
								{voiceUsername} Share Screen
							</Text>
						</View>
					)}
					{!isPiPMode && (
						<View style={[styles.focusIcon, styles.focusIconAbsolute]}>
							<Icons.ArrowSaltIcon height={size.s_14} color={themeValue.white} />
						</View>
					)}
				</TouchableOpacity>
			)}

			{videoTrackRef && (
				<View
					style={[
						styles.userView,
						isGridLayout && { width: '48%', height: size.s_150 },
						isTabletLandscape && { height: size.s_150 + size.s_100 },
						isPiPMode && { height: size.s_60 * 2, width: '45%', marginHorizontal: size.s_4 },
						{
							flexDirection: 'column'
						}
					]}
				>
					<VideoTrack
						trackRef={videoTrackRef}
						style={styles.participantView}
						iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
					/>
					<View style={[styles.userName, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
						{participant.isMicrophoneEnabled ? (
							<MezonIconCDN icon={IconCDN.microphoneIcon} height={size.s_14} color={themeValue.white} />
						) : (
							<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_14} color={themeValue.white} />
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
						isTabletLandscape && { height: size.s_150 + size.s_100 },
						isPiPMode && { height: size.s_60 * 2, width: '45%', marginHorizontal: size.s_4 },
						{
							flexDirection: 'column'
						}
					]}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: size.s_10 }}>
						{isLoading ? (
							<Icons.LoadingIcon width={24} height={24} />
						) : (
							<MezonAvatar width={size.s_50} height={size.s_50} username={voiceUsername} avatarUrl={avatar} />
						)}
					</View>
					{!isPiPMode && (
						<View style={styles.wrapperUser}>
							{participant.isMicrophoneEnabled ? (
								<MezonIconCDN icon={IconCDN.microphoneIcon} height={size.s_14} />
							) : (
								<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_14} color={themeValue.white} />
							)}
							{isLoading ? (
								<Icons.LoadingIcon width={24} height={24} />
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
};

const ParticipantScreen = ({ sortedParticipants, setFocusedScreenShare }) => {
	const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.ScreenShareAudio]);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const videoTrackCount = sortedParticipants.reduce((count, participant) => {
		if (participant.isScreenShareEnabled) count += 1;
		if (participant.isCameraEnabled || participant.isScreenShareEnabled) count += 1;
		else count += 1;
		return count;
	}, 0);

	const isGridLayout = videoTrackCount >= 3 || isPiPMode;

	return (
		<ScrollView style={{ marginHorizontal: isPiPMode ? 0 : size.s_10 }} showsVerticalScrollIndicator={false}>
			<View
				style={
					isGridLayout
						? {
								flexDirection: 'row',
								flexWrap: 'wrap',
								justifyContent: isPiPMode ? 'space-between' : 'center',
								gap: isPiPMode ? size.s_2 : size.s_10,
								alignItems: isPiPMode ? 'flex-start' : 'center'
							}
						: { gap: size.s_10 }
				}
			>
				{sortedParticipants?.length > 0 &&
					sortedParticipants?.map((participant) => (
						<ParticipantItem
							key={participant.identity}
							participant={participant}
							tracks={tracks}
							setFocusedScreenShare={setFocusedScreenShare}
							isGridLayout={isGridLayout}
						/>
					))}
			</View>
			<View style={{ height: size.s_300 }} />
		</ScrollView>
	);
};

export default React.memo(ParticipantScreen);
