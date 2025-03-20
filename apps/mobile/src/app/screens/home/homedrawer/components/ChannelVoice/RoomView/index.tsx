import { TrackReference, useLocalParticipant, useParticipants, useRoomContext, useTracks, VideoTrack } from '@livekit/react-native';
import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	Icons,
	jumpToChannel,
	load,
	save,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { clansActions, selectVoiceInfo, useAppDispatch } from '@mezon/store';
import { useNavigation } from '@react-navigation/native';
import { Track } from 'livekit-client';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Platform, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import FocusedScreenPopup from '../FocusedScreenPopup';
import ParticipantScreen from '../ParticipantScreen';
import { style } from '../styles';

const RoomView = ({
	isAnimationComplete,
	onPressMinimizeRoom,
	channelId,
	clanId
}: {
	isAnimationComplete: boolean;
	onPressMinimizeRoom: () => void;
	channelId: string;
	clanId: string;
}) => {
	const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const room = useRoomContext();
	const participants = useParticipants();
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const { isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled, localParticipant } = useLocalParticipant();
	const voiceInfo = useSelector(selectVoiceInfo);
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);

	useEffect(() => {
		localParticipant.setCameraEnabled(false);
		localParticipant.setMicrophoneEnabled(false);
	}, [localParticipant]);

	const sortedParticipants = [...participants].sort((a, b) => (b.isScreenShareEnabled ? 1 : 0) - (a.isScreenShareEnabled ? 1 : 0));

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
		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, { isEndCall: true, clanId: voiceInfo?.clanId, channelId: voiceInfo?.channelId });
	}, [room, voiceInfo?.channelId, voiceInfo?.clanId]);

	const handleShowChat = () => {
		if (!isTabletLandscape) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
		}
		joinChannel();
		onPressMinimizeRoom();
	};

	useEffect(() => {
		if (focusedScreenShare) {
			const focusedParticipant = sortedParticipants.find((p) => p.identity === focusedScreenShare?.participant?.identity);

			if (!focusedParticipant?.isScreenShareEnabled) {
				setFocusedScreenShare(null);
			}
		}
	}, [sortedParticipants, focusedScreenShare]);

	const joinChannel = async () => {
		const clanIdCache = load(STORAGE_CLAN_ID);
		if (clanIdCache !== clanId) {
			const joinAndChangeClan = async (clanId: string) => {
				await Promise.all([
					dispatch(clansActions.joinClan({ clanId: clanId })),
					dispatch(clansActions.changeCurrentClan({ clanId: clanId, noCache: true }))
				]);
			};
			await joinAndChangeClan(clanId);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
			isFetchMemberChannelDM: true
		});
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		save(STORAGE_CLAN_ID, clanId);
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

	return (
		<View style={styles.roomViewcontainer}>
			{!isAnimationComplete ? (
				<FocusedScreenPopup sortedParticipants={sortedParticipants} tracks={tracks} localParticipant={localParticipant} />
			) : (
				<ParticipantScreen
					sortedParticipants={sortedParticipants}
					tracks={tracks}
					isFocusedScreen={focusedScreenShare}
					setFocusedScreenShare={setFocusedScreenShare}
				/>
			)}
			{isAnimationComplete && (
				<View style={[styles.menuFooter, { bottom: Platform.OS === 'ios' || isTabletLandscape ? size.s_100 : size.s_50 }]}>
					<View style={{ gap: size.s_16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: size.s_6 }}>
						<TouchableOpacity onPress={handleToggleCamera} style={styles.menuIcon}>
							{isCameraEnabled ? <MezonIconCDN icon={IconCDN.videoIcon} /> : <MezonIconCDN icon={IconCDN.videoSlashIcon} />}
						</TouchableOpacity>
						<TouchableOpacity onPress={handleToggleMicrophone} style={styles.menuIcon}>
							{isMicrophoneEnabled ? (
								<MezonIconCDN icon={IconCDN.microphoneIcon} />
							) : (
								<MezonIconCDN icon={IconCDN.microphoneSlashIcon} />
							)}
						</TouchableOpacity>
						<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
							<MezonIconCDN icon={IconCDN.chatIcon} />
						</TouchableOpacity>
						<TouchableOpacity onPress={handleToggleScreenShare} style={styles.menuIcon}>
							{isScreenShareEnabled ? <Icons.ShareScreenIcon /> : <Icons.ShareScreenSlashIcon />}
						</TouchableOpacity>
						<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
							<MezonIconCDN icon={IconCDN.phoneCallIcon} />
						</TouchableOpacity>
					</View>
				</View>
			)}
		</View>
	);
};

export default React.memo(RoomView);
