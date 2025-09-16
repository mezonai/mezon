import { useParticipants, useRoomContext, useTracks, VideoTrack } from '@livekit/react-native';
import { useAuth, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	getStore,
	selectCurrentClanId,
	selectIsPiPMode,
	selectMemberClanByUserName,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { Participant, RoomEvent, Track } from 'livekit-client';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import MezonConfirm from '../../../../../../componentUI/MezonConfirm';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { style } from '../styles';

const ParticipantItem = memo(
	({
		username,
		isMicrophoneEnabled,
		isSpeaking,
		screenTrackRef,
		videoTrackRef,
		setFocusedScreenShare,
		activeSoundReactions,
		room,
		isGroupCall,
		canMangeVoice,
		currentUsername
	}: any) => {
		const isTabletLandscape = useTabletLandscape();
		const store = getStore();
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { t } = useTranslation(['channelVoice']);
		const member = useMemo(() => {
			return selectMemberClanByUserName(store.getState(), username);
		}, [username]);

		const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
		const voiceUsername = member?.clan_nick || member?.user?.display_name || username;
		const avatar = useMemo(() => {
			return member?.clan_avatar || member?.user?.avatar_url || '';
		}, [member]);
		const dispatch = useAppDispatch();

		const isShowMuteMenu = useMemo(() => {
			return currentUsername !== username && !isPiPMode && !isGroupCall && canMangeVoice;
		}, [currentUsername, username, isPiPMode, isGroupCall, canMangeVoice]);

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
					<MezonIconCDN icon={IconCDN.activityIcon} height={size.s_16} width={size.s_16} color="#fff" />
				</View>
			);
		};

		const onMuteParticipant = useCallback(() => {
			dispatch(voiceActions.muteVoiceMember({ room_name: room, username: username }));
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		}, [dispatch, room, username]);

		const onKickParticipant = useCallback(() => {
			dispatch(voiceActions.kickVoiceMember({ room_name: room, username: username }));
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		}, [dispatch, room, username]);

		const handleMuteparticipant = useCallback(() => {
			const data = {
				children: (
					<MezonConfirm
						onConfirm={onMuteParticipant}
						title={t('muteModal.title')}
						confirmText={t('muteModal.mute')}
						content={t('muteModal.content', { userName: voiceUsername })}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		}, [onMuteParticipant, t, voiceUsername]);

		const handleKickparticipant = useCallback(() => {
			const data = {
				children: (
					<MezonConfirm
						onConfirm={onKickParticipant}
						title={t('kickModal.title')}
						confirmText={t('kickModal.kick')}
						content={t('kickModal.content', { userName: voiceUsername })}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		}, [onKickParticipant, t, voiceUsername]);

		const renderMuteOption = (isMicrophoneEnabled: boolean) => {
			return (
				<View style={styles.muteOptions}>
					{isMicrophoneEnabled && (
						<TouchableOpacity style={styles.muteIcon} onPress={handleMuteparticipant}>
							<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_16} width={size.s_16} color={themeValue.textStrong} />
						</TouchableOpacity>
					)}

					<TouchableOpacity style={styles.muteIcon} onPress={handleKickparticipant}>
						<MezonIconCDN icon={IconCDN.closeSmallBold} height={size.s_16} width={size.s_16} color={themeValue.textStrong} />
					</TouchableOpacity>
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
						{isShowMuteMenu && renderMuteOption(isMicrophoneEnabled)}
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
						{isShowMuteMenu && renderMuteOption(isMicrophoneEnabled)}
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
			prevProps?.activeSoundReactions === nextProps?.activeSoundReactions &&
			prevProps?.room === nextProps?.room &&
			prevProps?.isGroupCall === nextProps?.isGroupCall &&
			prevProps?.canMangeVoice === nextProps?.canMangeVoice &&
			prevProps?.currentUsername === nextProps?.currentUsername
		);
	}
);

const ParticipantScreen = ({ setFocusedScreenShare, activeSoundReactions, isGroupCall, clanId }) => {
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
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const currentClanId = useAppSelector(selectCurrentClanId);
	const [canMangeVoice] = usePermissionChecker([EPermission.manageChannel]);
	const userCanManageVoice = useMemo(() => {
		if (clanId === currentClanId) {
			return canMangeVoice;
		}
		return false;
	}, [clanId, currentClanId, canMangeVoice]);
	const { userProfile } = useAuth();
	const { name } = useRoomContext();

	const sortedParticipantsRef = useRef<Participant[]>([]);

	const sortedParticipants = useMemo(() => {
		try {
			const sortBySpeaking = participants?.length >= 10;
			const currentSids = new Set(participants?.map((p) => p?.sid)?.filter(Boolean));

			const remaining = sortedParticipantsRef?.current?.filter((p) => currentSids?.has?.(p?.sid)) ?? [];

			const remainingSet = new Set(remaining?.map?.((p) => p?.sid));
			const newOnes = participants?.filter((p) => !remainingSet.has(p?.sid)) ?? [];

			const combined = [...remaining, ...newOnes];

			const sorted = combined.sort((a, b) => {
				const score = (p: Participant) => (p?.isScreenShareEnabled ? 2 : 0) + (sortBySpeaking && p?.isSpeaking ? 1 : 0);
				return score(b) - score(a);
			});

			sortedParticipantsRef.current = sorted;
			return sorted;
		} catch (e) {
			return participants;
		}
	}, [participants]);

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

						const currentUsername = userProfile?.user?.username;

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
								room={name}
								isGroupCall={isGroupCall}
								canMangeVoice={userCanManageVoice}
								currentUsername={currentUsername}
							/>
						);
					})}
			</View>
			<View style={{ height: size.s_300 }} />
		</ScrollView>
	);
};

export default React.memo(ParticipantScreen);
