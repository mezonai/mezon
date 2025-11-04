import type { TrackReference } from '@livekit/react-native';
import { VideoTrack, useParticipants, useRoomContext } from '@livekit/react-native';
import { ScreenCapturePickerView } from '@livekit/react-native-webrtc';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { ThemeModeBase, size, useTheme } from '@mezon/mobile-ui';
import {
	groupCallActions,
	selectIsPiPMode,
	selectIsShowPreCallInterface,
	selectVoiceInfo,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import type { Participant, TrackPublication } from 'livekit-client';
import { DisconnectReason, RoomEvent, Track } from 'livekit-client';
import LottieView from 'lottie-react-native';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native';
import { ResumableZoom } from 'react-native-zoom-toolkit';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../../../../../assets/lottie';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import type { ActiveSoundReaction } from '../../../../../../hooks/useSoundReactions';
import { ContainerMessageActionModal } from '../../MessageItemBS/ContainerMessageActionModal';
import ControlBottomBar from '../ControlBottomBar';
import FocusedScreenPopup from '../FocusedScreenPopup';
import ParticipantScreen from '../ParticipantScreen';
import ReasonPopup from '../ReasonPopup';
import { style } from '../styles';
import { createStyles } from './index.styles';

const RoomViewListener = memo(
	({
		isShowPreCallInterface,
		focusedScreenShare,
		setFocusedScreenShare,
		channelId,
		clanId
	}: {
		isShowPreCallInterface: boolean;
		focusedScreenShare: TrackReference;
		setFocusedScreenShare: any;
		channelId: string;
		clanId: string;
	}) => {
		const participants = useParticipants();
		const dispatch = useAppDispatch();
		const room: any = useRoomContext();
		const { t } = useTranslation(['channelVoice']);
		const voiceInfo = useSelector(selectVoiceInfo);

		useEffect(() => {
			if (!voiceInfo) {
				handleShowDisconnectModal();
			}
		}, [voiceInfo]);

		useEffect(() => {
			if (participants?.length > 1 && isShowPreCallInterface) {
				dispatch(groupCallActions?.hidePreCallInterface());
			}
		}, [dispatch, isShowPreCallInterface, participants?.length]);

		const getReasonContent = useCallback(
			(reason: DisconnectReason) => {
				switch (reason) {
					case DisconnectReason.PARTICIPANT_REMOVED:
						return t('disconnectModal.content.removed');
					case DisconnectReason.DUPLICATE_IDENTITY:
						return t('disconnectModal.content.duplicate');
					case DisconnectReason.ROOM_DELETED:
						return t('disconnectModal.content.deleted');
					default:
						return t('disconnectModal.content.default');
				}
			},
			[t]
		);

		const handleShowDisconnectModal = useCallback(
			(reason?: DisconnectReason) => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, {
					isEndCall: true,
					clanId,
					channelId,
					roomId: room?.roomInfo?.sid as string
				});
				room.disconnect();
				dispatch(voiceActions.setPiPModeMobile(false));

				if (reason) {
					const content = getReasonContent(reason);
					const data = {
						children: <ReasonPopup title={t('disconnectModal.title')} confirmText={t('disconnectModal.confirm')} content={content} />
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
				}
			},
			[channelId, clanId, dispatch, getReasonContent, room, t]
		);

		const handleDisconnected = useCallback(
			async (reason?: DisconnectReason) => {
				if (
					reason === DisconnectReason.PARTICIPANT_REMOVED ||
					reason === DisconnectReason.DUPLICATE_IDENTITY ||
					reason === DisconnectReason.ROOM_DELETED
				) {
					handleShowDisconnectModal(reason);
				}
			},
			[handleShowDisconnectModal]
		);

		const handleParticipantDisconnected = useCallback(
			(participant: Participant) => {
				if (focusedScreenShare?.participant?.identity === participant.identity) {
					setFocusedScreenShare(null);
				}
			},
			[focusedScreenShare?.participant?.identity, setFocusedScreenShare]
		);

		const handleTrackUnpublished = useCallback(
			(publication: TrackPublication) => {
				if (publication.source === Track.Source.ScreenShare && publication.trackSid === focusedScreenShare?.publication?.trackSid) {
					setFocusedScreenShare(null);
				}
			},
			[focusedScreenShare?.publication?.trackSid, setFocusedScreenShare]
		);

		useEffect(() => {
			room?.on(RoomEvent.Disconnected, handleDisconnected);
			room?.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
			room?.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
			return () => {
				if (room) {
					room.off(RoomEvent.Disconnected, handleDisconnected);
					room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
					room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
				}
			};
		}, [handleDisconnected, handleParticipantDisconnected, handleTrackUnpublished, room]);
		return null;
	}
);

const RoomView = ({
	isAnimationComplete,
	onPressMinimizeRoom,
	channelId,
	clanId,
	onFocusedScreenChange,
	isGroupCall = false,
	participantsCount = 0,
	activeSoundReactions,
	allUserClans
}: {
	isAnimationComplete: boolean;
	onPressMinimizeRoom: () => void;
	channelId: string;
	clanId: string;
	onFocusedScreenChange: (track: TrackReference | null) => void;
	isGroupCall?: boolean;
	participantsCount?: number;
	activeSoundReactions: Map<string, ActiveSoundReaction>;
	allUserClans: UsersClanEntity[];
}) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const localStyles = createStyles();
	const voiceInfo = useSelector(selectVoiceInfo);
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const [isHiddenControl, setIsHiddenControl] = useState<boolean>(false);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const screenCaptureRef = React.useRef(null);
	const isShowPreCallInterface = useSelector(selectIsShowPreCallInterface);
	const layoutRef = useRef({ width: 0, height: 0 });

	const checkOrientation = () => {
		const { width, height } = Dimensions.get('window');
		layoutRef.current = { width, height };
	};
	useEffect(() => {
		checkOrientation();

		const subscription = Dimensions.addEventListener('change', (handler) => {
			const screen = handler?.screen;
			if (screen?.width && screen?.height) {
				layoutRef.current = { width: screen?.width, height: screen?.height };
			}
		});

		return () => {
			subscription && subscription.remove();
		};
	}, []);

	useEffect(() => {
		const subscription = focusedScreenShare
			? Dimensions.addEventListener('change', () => {
					setIsHiddenControl((prevState) => !prevState);
				})
			: null;

		return () => subscription?.remove();
	}, [focusedScreenShare]);

	const handleOpenEmojiPicker = () => {
		const data = {
			snapPoints: ['45%', '75%'],
			children: (
				<ContainerMessageActionModal
					message={undefined}
					mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
					senderDisplayName={''}
					isOnlyEmojiPicker={true}
					channelId={voiceInfo?.channelId}
				/>
			),
			containerStyle: { zIndex: 1001 },
			backdropStyle: { zIndex: 1000 }
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	useEffect(() => {
		onFocusedScreenChange(focusedScreenShare);
	}, [focusedScreenShare, onFocusedScreenChange]);

	const setFocusedScreenShareProp = useCallback((data: TrackReference | null) => {
		setFocusedScreenShare(data);
	}, []);

	if (focusedScreenShare) {
		return (
			<View style={localStyles.focusedScreenContainer}>
				<View style={localStyles.focusedScreenWrapper}>
					<ResumableZoom onTap={() => setIsHiddenControl((prevState) => !prevState)} allowPinchPanning={false}>
						<View style={{ height: layoutRef?.current?.height, width: layoutRef?.current?.width }}>
							<VideoTrack
								trackRef={focusedScreenShare}
								objectFit={'contain'}
								style={localStyles.videoTrack}
								iosPIP={{ enabled: true, startAutomatically: true, preferredSize: { width: 12, height: 8 } }}
							/>
						</View>
					</ResumableZoom>
				</View>
				{!isPiPMode && (
					<View style={[styles.wrapperHeaderFocusSharing]}>
						<TouchableOpacity style={[styles.focusIcon]} onPress={() => handleOpenEmojiPicker()}>
							<MezonIconCDN icon={IconCDN.reactionIcon} height={size.s_16} width={size.s_24} color={themeValue.white} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.focusIcon} onPress={() => setFocusedScreenShare(null)}>
							<MezonIconCDN icon={IconCDN.minimizeIcon} height={size.s_16} color={themeValue.white} />
						</TouchableOpacity>
					</View>
				)}
				<ControlBottomBar
					isShow={isAnimationComplete && !isPiPMode && !isHiddenControl}
					onPressMinimizeRoom={onPressMinimizeRoom}
					focusedScreenShare={focusedScreenShare}
					channelId={channelId}
					clanId={clanId}
					isGroupCall={isGroupCall}
				/>
				<RoomViewListener
					isShowPreCallInterface={isShowPreCallInterface}
					focusedScreenShare={focusedScreenShare}
					setFocusedScreenShare={setFocusedScreenShareProp}
					channelId={channelId}
					clanId={clanId}
				/>
			</View>
		);
	}

	return (
		<View style={[styles.roomViewContainer, isPiPMode && styles.roomViewContainerPiP]}>
			{!isAnimationComplete ? (
				<FocusedScreenPopup clanUsers={allUserClans} />
			) : (
				<ParticipantScreen
					setFocusedScreenShare={setFocusedScreenShareProp}
					activeSoundReactions={activeSoundReactions}
					isGroupCall={isGroupCall}
					clanId={clanId}
					channelId={channelId}
					clanUsers={allUserClans}
				/>
			)}
			{isAnimationComplete && isGroupCall && isShowPreCallInterface && (
				<View style={localStyles.preCallContainer}>
					<LottieView
						source={themeBasic === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE}
						autoPlay
						loop
						style={localStyles.lottieView}
					/>
					<Text style={styles.text}>{`${participantsCount} members will be notified`}</Text>
				</View>
			)}
			<ControlBottomBar
				isShow={isAnimationComplete && !isPiPMode}
				onPressMinimizeRoom={onPressMinimizeRoom}
				focusedScreenShare={focusedScreenShare}
				channelId={channelId}
				clanId={clanId}
				isGroupCall={isGroupCall}
			/>
			{Platform.OS === 'ios' && <ScreenCapturePickerView ref={screenCaptureRef} />}
			<RoomViewListener
				isShowPreCallInterface={isShowPreCallInterface}
				focusedScreenShare={focusedScreenShare}
				setFocusedScreenShare={setFocusedScreenShareProp}
				channelId={channelId}
				clanId={clanId}
			/>
		</View>
	);
};

export default React.memo(RoomView);
