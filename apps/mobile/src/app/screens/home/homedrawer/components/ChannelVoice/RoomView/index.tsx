import { TrackReference, VideoTrack, useParticipants } from '@livekit/react-native';
import { ScreenCapturePickerView } from '@livekit/react-native-webrtc';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { ThemeModeBase, size, useTheme } from '@mezon/mobile-ui';
import {
	groupCallActions,
	selectIsPiPMode,
	selectIsShowPreCallInterface,
	selectVoiceInfo,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { Participant } from 'livekit-client';
import LottieView from 'lottie-react-native';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native';
import { ResumableZoom } from 'react-native-zoom-toolkit';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../../../../../assets/lottie';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { EMessageBSToShow } from '../../../enums';
import { ContainerMessageActionModal } from '../../MessageItemBS/ContainerMessageActionModal';
import ControlBottomBar from '../ControlBottomBar';
import FocusedScreenPopup from '../FocusedScreenPopup';
import ParticipantScreen from '../ParticipantScreen';
import { style } from '../styles';

const PARTICIPANT_COUNT_THRESHOLD = 8;

const RoomView = ({
	isAnimationComplete,
	onPressMinimizeRoom,
	channelId,
	clanId,
	onFocusedScreenChange,
	isGroupCall = false,
	participantsCount = 0
}: {
	isAnimationComplete: boolean;
	onPressMinimizeRoom: () => void;
	channelId: string;
	clanId: string;
	onFocusedScreenChange: (track: TrackReference | null) => void;
	isGroupCall?: boolean;
	participantsCount?: number;
}) => {
	const marginWidth = Dimensions.get('screen').width;
	const dispatch = useAppDispatch();
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const participants = useParticipants();
	const voiceInfo = useSelector(selectVoiceInfo);
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const [isHiddenControl, setIsHiddenControl] = useState<boolean>(false);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const screenCaptureRef = React.useRef(null);
	const isShowPreCallInterface = useSelector(selectIsShowPreCallInterface);
	const [sortedParticipants, setSortedParticipants] = useState<Participant[]>([]);

	useEffect(() => {
		const subscription = focusedScreenShare
			? Dimensions.addEventListener('change', () => {
					setIsHiddenControl((prevState) => !prevState);
				})
			: null;

		return () => subscription?.remove();
	}, [focusedScreenShare]);

	useEffect(() => {
		if (participants?.length > 1 && isShowPreCallInterface) {
			dispatch(groupCallActions?.hidePreCallInterface());
		}
	}, [dispatch, isShowPreCallInterface, participants?.length]);

	useEffect(() => {
		setSortedParticipants((prev) => {
			const sortBySpeaking = participants?.length > PARTICIPANT_COUNT_THRESHOLD;
			const currentSids = new Set(participants?.map((p) => p?.sid));
			const remaining = prev?.filter((p) => currentSids?.has(p?.sid));

			const remainingSet = new Set(remaining.map((p) => p.sid));
			const newOnes = participants?.filter((p) => !remainingSet?.has(p?.sid));

			const combined = [...(remaining ?? []), ...(newOnes ?? [])];
			const sorted = combined?.sort((a, b) => {
				const score = (p: Participant) => (p?.isScreenShareEnabled ? 2 : 0) + (sortBySpeaking && p?.isSpeaking ? 1 : 0);
				return score(b) - score(a);
			});

			return sorted;
		});
	}, [participants]);

	useEffect(() => {
		if (focusedScreenShare) {
			const focusedParticipant = sortedParticipants.find((p) => p.identity === focusedScreenShare?.participant?.identity);

			if (!focusedParticipant?.isScreenShareEnabled) {
				setFocusedScreenShare(null);
			}
		}
	}, [sortedParticipants, focusedScreenShare]);

	const handleOpenEmojiPicker = () => {
		const data = {
			snapPoints: ['45%', '75%'],
			children: (
				<ContainerMessageActionModal
					message={undefined}
					mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
					type={EMessageBSToShow.MessageAction}
					senderDisplayName={''}
					isOnlyEmojiPicker={true}
					channelId={voiceInfo?.channelId}
					clanId={voiceInfo?.clanId}
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
			<View style={{ width: '100%', flex: 1, alignItems: 'center' }}>
				<View style={{ height: '100%', width: '100%' }}>
					<ResumableZoom onTap={() => setIsHiddenControl((prevState) => !prevState)}>
						<View style={{ height: '100%', width: marginWidth }}>
							<VideoTrack
								trackRef={focusedScreenShare}
								objectFit={'contain'}
								style={{
									height: isPiPMode ? size.s_100 * 1.2 : '100%',
									width: isPiPMode ? '50%' : '100%',
									alignSelf: 'center'
								}}
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
							<Icons.ArrowShrinkIcon height={size.s_16} color={themeValue.white} />
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
			</View>
		);
	}

	return (
		<View style={[styles.roomViewContainer, isPiPMode && styles.roomViewContainerPiP]}>
			{!isAnimationComplete ? (
				<FocusedScreenPopup sortedParticipants={sortedParticipants} />
			) : (
				<ParticipantScreen sortedParticipants={sortedParticipants} setFocusedScreenShare={setFocusedScreenShareProp} />
			)}
			{isAnimationComplete && isGroupCall && participants.length <= 1 && isShowPreCallInterface && (
				<View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: size.s_100 * 2 }}>
					<LottieView
						source={themeBasic === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE}
						autoPlay
						loop
						style={{ width: size.s_60, height: size.s_60 }}
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
		</View>
	);
};

export default React.memo(RoomView);
