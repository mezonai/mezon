import { TrackReference, useLocalParticipant, useParticipants, useRoomContext, useTracks, VideoTrack } from '@livekit/react-native';
import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	Icons,
	jumpToChannel,
	save,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentClanId } from '@mezon/store';
import { useNavigation } from '@react-navigation/native';
import { LocalParticipant, RemoteParticipant, Track } from 'livekit-client';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MezonAvatar } from '../../../../../../componentUI';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { style } from '../styles';

const RoomView = ({
	isAnimationComplete,
	onPressMinimizeRoom,
	channelId
}: {
	isAnimationComplete: boolean;
	onPressMinimizeRoom: () => void;
	channelId: string;
}) => {
	const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const room = useRoomContext();
	const participants = useParticipants();
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const { isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled, localParticipant } = useLocalParticipant();
	const currentClanId = useSelector(selectCurrentClanId);
	const voiceChannelId = null;
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);

	useEffect(() => {
		localParticipant.setCameraEnabled(false);
		localParticipant.setMicrophoneEnabled(false);
	}, [localParticipant]);

	const sortedParticipants = [...participants].sort((a, b) => (b.isScreenShareEnabled ? 1 : 0) - (a.isScreenShareEnabled ? 1 : 0));

	const videoTrackCount = sortedParticipants.reduce((count, participant) => {
		if (participant.isScreenShareEnabled) {
			count += 1;
		}
		if (participant.isCameraEnabled || participant.isScreenShareEnabled) {
			count += 1;
		} else {
			count += 1;
		}
		return count;
	}, 0);

	const isGridLayout = videoTrackCount >= 3;

	const renderParticipant = (participant: LocalParticipant | RemoteParticipant) => {
		const videoTrackRef = tracks.find(
			(t) => t.participant.identity === participant.identity && t.source === Track.Source.Camera && t.participant.isCameraEnabled === true
		);

		const screenTrackRef = tracks.find((t) => t.participant.identity === participant.identity && t.source === Track.Source.ScreenShare);
		const handleFocusScreen = (screenTrack: TrackReference) => {
			setFocusedScreenShare(screenTrack);
		};

		const isFocusedScreen = focusedScreenShare === screenTrackRef;

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
						<View style={[styles.userName, { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
							<Icons.ShareScreenIcon height={size.s_14} />
							<Text
								numberOfLines={1}
								ellipsizeMode="tail"
								style={[styles.subTitle, isFocusedScreen ? { width: '100%' } : { width: '48%' }]}
							>
								{participant.identity} {isFocusedScreen && `(Share Screen)`}
							</Text>
						</View>
						<TouchableOpacity style={styles.focusIcon} onPress={() => handleFocusScreen(screenTrackRef)}>
							<Icons.ArrowSaltIcon height={size.s_14} />
						</TouchableOpacity>
					</View>
				)}

				{videoTrackRef && (
					<View style={[styles.userView, isGridLayout && { width: '48%', height: 150 }, isTabletLandscape && { height: 250 }]}>
						<VideoTrack trackRef={videoTrackRef} style={styles.participantView} />
						<View style={[styles.userName, { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
							{participant.isMicrophoneEnabled ? (
								<Icons.MicrophoneIcon height={size.s_14} />
							) : (
								<Icons.MicrophoneSlashIcon height={size.s_14} />
							)}
							<Text style={styles.subTitle}>{participant.identity || 'Unknown'}</Text>
						</View>
					</View>
				)}

				{!videoTrackRef && (
					<View style={[styles.userView, isGridLayout && { width: '48%', height: 150 }, isTabletLandscape && { height: 250 }]}>
						<View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
							<MezonAvatar width={size.s_50} height={size.s_50} username={participant.identity} avatarUrl={participant.metadata} />
						</View>
						<View style={[styles.userName, { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
							{participant.isMicrophoneEnabled ? (
								<Icons.MicrophoneIcon height={size.s_14} />
							) : (
								<Icons.MicrophoneSlashIcon height={size.s_14} />
							)}
							<Text style={styles.subTitle}>{participant.identity || 'Unknown'}</Text>
						</View>
					</View>
				)}
			</>
		);
	};

	const handleToggleCamera = useCallback(() => {
		localParticipant.setCameraEnabled(!isCameraEnabled);
	}, [isCameraEnabled, localParticipant]);

	const handleToggleMicrophone = useCallback(() => {
		localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
	}, [isMicrophoneEnabled, localParticipant]);

	const handleToggleScreenShare = useCallback(() => {
		localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
	}, [isScreenShareEnabled, localParticipant]);

	const handleEndCall = useCallback(() => {
		room.disconnect();
		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, { isEndCall: true, voiceChannelId });
	}, [room, voiceChannelId]);

	const handleShowChat = () => {
		if (!isTabletLandscape) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
		}
		joinChannel();
		onPressMinimizeRoom();
	};

	const joinChannel = async () => {
		const clanId = currentClanId;
		DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
			isFetchMemberChannelDM: true
		});
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		await jumpToChannel(channelId, clanId);
	};

	if (focusedScreenShare) {
		return (
			<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<View style={{ height: 3 * size.s_100, width: '100%', alignSelf: 'center' }}>
					<VideoTrack trackRef={focusedScreenShare} style={{ height: 3 * size.s_100, width: '100%', alignSelf: 'center' }} />
				</View>
				<TouchableOpacity style={styles.focusIcon} onPress={() => setFocusedScreenShare(null)}>
					<Icons.ArrowShrinkIcon height={size.s_16} />
				</TouchableOpacity>
			</View>
		);
	}

	const renderFocusedParticipant = () => {
		if (isAnimationComplete) return null;
		const otherParticipants = sortedParticipants.filter((p) => p.identity !== localParticipant.identity);
		const selfParticipant = sortedParticipants.find((p) => p.identity === localParticipant.identity);

		const screenShareOther = otherParticipants.find((p) => p.isScreenShareEnabled);
		if (screenShareOther) {
			const screenTrackRef = tracks.find((t) => t.participant.identity === screenShareOther.identity && t.source === Track.Source.ScreenShare);
			if (screenTrackRef) {
				return (
					<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
						<View style={{ height: size.s_100, width: '100%', alignSelf: 'center' }}>
							<VideoTrack trackRef={screenTrackRef} style={{ height: size.s_100, width: '100%', alignSelf: 'center' }} />
						</View>
					</View>
				);
			}
		}

		if (selfParticipant?.isScreenShareEnabled) {
			const selfScreenTrackRef = tracks.find(
				(t) => t.participant.identity === selfParticipant.identity && t.source === Track.Source.ScreenShare
			);
			if (selfScreenTrackRef) {
				return (
					<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
						<View style={{ height: size.s_100, width: '100%', alignSelf: 'center' }}>
							<VideoTrack trackRef={selfScreenTrackRef} style={{ height: size.s_100, width: '100%', alignSelf: 'center' }} />
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
						<View style={{ height: 100, width: '100%', alignSelf: 'center' }}>
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

		const randomParticipant = sortedParticipants[0];
		if (randomParticipant) {
			return (
				<View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
						<MezonAvatar
							width={size.s_50}
							height={size.s_50}
							username={randomParticipant.identity}
							avatarUrl={randomParticipant.metadata}
						/>
					</View>
					<View style={[styles.userName, { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
						{randomParticipant.isMicrophoneEnabled ? (
							<Icons.MicrophoneIcon height={size.s_14} />
						) : (
							<Icons.MicrophoneSlashIcon height={size.s_14} />
						)}
						<Text style={styles.subTitle}>{randomParticipant.identity || 'Unknown'}</Text>
					</View>
				</View>
			);
		}

		return null;
	};

	return (
		<View style={styles.roomViewcontainer}>
			{!isAnimationComplete ? (
				renderFocusedParticipant()
			) : (
				<View style={{ marginBottom: isTabletLandscape ? '5%' : '30%' }}>
					<ScrollView
						style={{ marginHorizontal: size.s_10 }}
						contentContainerStyle={
							isGridLayout
								? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: size.s_10, alignItems: 'center' }
								: { gap: size.s_10 }
						}
					>
						{sortedParticipants.map((participant) => renderParticipant(participant))}
					</ScrollView>
				</View>
			)}
			{isAnimationComplete && (
				<View style={[styles.menuFooter, { bottom: Platform.OS === 'ios' || isTabletLandscape ? size.s_100 : size.s_50 }]}>
					<View style={{ gap: size.s_16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: size.s_6 }}>
						<TouchableOpacity onPress={handleToggleCamera} style={styles.menuIcon}>
							{isCameraEnabled ? <Icons.VideoIcon /> : <Icons.VideoSlashIcon />}
						</TouchableOpacity>
						<TouchableOpacity onPress={handleToggleMicrophone} style={styles.menuIcon}>
							{isMicrophoneEnabled ? <Icons.MicrophoneIcon /> : <Icons.MicrophoneSlashIcon />}
						</TouchableOpacity>
						<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
							<Icons.ChatIcon />
						</TouchableOpacity>
						<TouchableOpacity onPress={handleToggleScreenShare} style={styles.menuIcon}>
							{isScreenShareEnabled ? <Icons.ShareScreenIcon /> : <Icons.ShareScreenSlashIcon />}
						</TouchableOpacity>
						<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
							<Icons.PhoneCallIcon />
						</TouchableOpacity>
					</View>
				</View>
			)}
		</View>
	);
};

export default React.memo(RoomView);
