import { useParticipants, useRoomContext, useTracks, VideoTrack } from '@livekit/react-native';
import { usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount, selectCurrentClanId, selectIsPiPMode, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import type { Participant } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import MezonAvatar from '../../../../../../componentUI/MezonAvatar';
import MezonConfirm from '../../../../../../componentUI/MezonConfirm';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import type { IManageVoiceUser } from '../../UserProfile';
import UserProfile, { IActionVoiceUser } from '../../UserProfile';
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
		currentUsername,
		member
	}: any) => {
		const isTabletLandscape = useTabletLandscape();
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { t } = useTranslation(['channelVoice']);

		const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
		const voiceUsername = member?.clan_nick || member?.user?.display_name || username;
		const avatar = useMemo(() => {
			return member?.clan_avatar || member?.user?.avatar_url || '';
		}, [member]);
		const dispatch = useAppDispatch();

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

		const onConfirmActionVoice = useCallback(
			(action: IActionVoiceUser) => {
				if (action === IActionVoiceUser.MUTE) {
					dispatch(voiceActions.muteVoiceMember({ room_name: room, username }));
				} else {
					dispatch(voiceActions.kickVoiceMember({ room_name: room, username }));
				}
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			},
			[dispatch, room, username]
		);

		const onActionVoice = useCallback(
			(action: IActionVoiceUser) => {
				const data = {
					children: (
						<MezonConfirm
							onConfirm={() => onConfirmActionVoice(action)}
							title={action === IActionVoiceUser.KICK ? t('kickModal.title') : t('muteModal.title')}
							confirmText={action === IActionVoiceUser.KICK ? t('kickModal.kick') : t('muteModal.mute')}
							content={t(action === IActionVoiceUser.KICK ? 'kickModal.content' : 'muteModal.content', { userName: voiceUsername })}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			},
			[onConfirmActionVoice, t, voiceUsername]
		);

		const onPressInfoUser = useCallback(
			async (userIsCurrentOnMic = false) => {
				const isHavePermission = currentUsername !== username && !isPiPMode && !isGroupCall && canMangeVoice;
				const manageVoiceUser: IManageVoiceUser = {
					isHavePermission,
					isShowMute: userIsCurrentOnMic
				};

				const data = {
					snapPoints: ['60%'],
					hiddenHeaderIndicator: true,
					containerStyle: styles.bottomSheetZIndex,
					backdropStyle: styles.bottomSheetZIndex,
					children: (
						<UserProfile
							user={member?.user || { username }}
							showAction={false}
							showRole={false}
							currentChannel={undefined}
							manageVoiceUser={manageVoiceUser}
							onActionVoice={onActionVoice}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			},
			[canMangeVoice, currentUsername, isGroupCall, isPiPMode, member?.user, onActionVoice, username]
		);

		return (
			<>
				{screenTrackRef && (
					<TouchableOpacity
						onPress={handleFocusScreen}
						style={[styles.userView, isTabletLandscape && styles.userViewTabletHeight, isPiPMode && styles.userViewPiPScreenShare]}
					>
						<VideoTrack
							objectFit={'contain'}
							trackRef={screenTrackRef}
							style={styles.participantView}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
						{!isPiPMode && hasActiveSoundReaction && renderSoundEffectIcon()}
						{!isPiPMode && (
							<View style={[styles.userName, styles.userNameFullWidth]}>
								<MezonIconCDN icon={IconCDN.shareScreenIcon} height={size.s_14} />
								<Text numberOfLines={1} ellipsizeMode="tail" style={[styles.subTitle, styles.subTitleFullWidth]}>
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
					<TouchableOpacity
						activeOpacity={0.8}
						onLongPress={() => onPressInfoUser(isMicrophoneEnabled)}
						style={[
							styles.userView,
							isTabletLandscape && styles.userViewTabletHeight,
							isPiPMode && styles.userViewPiPVideo,
							isSpeaking && [styles.userViewSpeaking, { borderColor: themeValue.textLink }]
						]}
					>
						<VideoTrack
							trackRef={videoTrackRef}
							style={styles.participantView}
							iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
						/>
						{hasActiveSoundReaction && renderSoundEffectIcon()}
						<View style={[styles.userName, styles.userNameCentered]}>
							{isMicrophoneEnabled ? (
								<MezonIconCDN icon={IconCDN.microphoneIcon} height={size.s_14} color={themeValue.text} />
							) : (
								<MezonIconCDN icon={IconCDN.microphoneSlashIcon} height={size.s_14} color={themeValue.text} />
							)}
							<Text style={styles.subTitle} numberOfLines={1}>
								{voiceUsername || 'Unknown'}
							</Text>
						</View>
					</TouchableOpacity>
				)}

				{!videoTrackRef && (
					<TouchableOpacity
						activeOpacity={0.8}
						onLongPress={() => onPressInfoUser(isMicrophoneEnabled)}
						style={[
							styles.userView,
							isTabletLandscape && styles.userViewTabletHeight,
							isPiPMode && styles.userViewPiPVideo,
							isSpeaking && [styles.userViewSpeaking, { borderColor: themeValue.textLink }]
						]}
					>
						{hasActiveSoundReaction && renderSoundEffectIcon()}
						<View style={styles.avatarContainer}>
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
					</TouchableOpacity>
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

const ParticipantScreen = ({ setFocusedScreenShare, activeSoundReactions, isGroupCall, clanId, channelId, clanUsers }) => {
	const participants = useParticipants();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
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
	const [canMangeVoice] = usePermissionChecker([EPermission.manageChannel], channelId, clanId);
	const userCanManageVoice = useMemo(() => {
		if (clanId === currentClanId) {
			return canMangeVoice;
		}
		return false;
	}, [clanId, currentClanId, canMangeVoice]);
	const userProfile = useSelector(selectAllAccount);
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
			style={isPiPMode ? styles.scrollViewMarginZero : styles.scrollViewMargin}
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
			<View style={isPiPMode ? styles.participantContainerPiP : styles.participantContainer}>
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
						const memberItem = clanUsers?.find((u) => u?.user?.username === participant?.identity);

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
								member={memberItem}
							/>
						);
					})}
			</View>
			<View style={styles.spacer} />
		</ScrollView>
	);
};

export default React.memo(ParticipantScreen);
