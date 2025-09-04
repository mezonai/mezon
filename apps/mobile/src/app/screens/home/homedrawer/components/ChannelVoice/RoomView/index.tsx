import { TrackReference, VideoTrack, useParticipants } from '@livekit/react-native';
import { ScreenCapturePickerView } from '@livekit/react-native-webrtc';
import { ActiveSoundReaction } from '@mezon/components';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { ThemeModeBase, size, useTheme } from '@mezon/mobile-ui';
import {
	groupCallActions,
	selectIsPiPMode,
	selectIsShowPreCallInterface,
	selectVoiceInfo,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import LottieView from 'lottie-react-native';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native';
import { ResumableZoom } from 'react-native-zoom-toolkit';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../../../../../assets/lottie';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { ContainerMessageActionModal } from '../../MessageItemBS/ContainerMessageActionModal';
import ControlBottomBar from '../ControlBottomBar';
import FocusedScreenPopup from '../FocusedScreenPopup';
import ParticipantScreen from '../ParticipantScreen';
import { style } from '../styles';

const RoomViewListener = memo(
	({
		isShowPreCallInterface,
		focusedScreenShare,
		setFocusedScreenShare
	}: {
		isShowPreCallInterface: boolean;
		focusedScreenShare: TrackReference;
		setFocusedScreenShare: any;
	}) => {
		const participants = useParticipants();
		const dispatch = useAppDispatch();

		useEffect(() => {
			if (participants?.length > 1 && isShowPreCallInterface) {
				dispatch(groupCallActions?.hidePreCallInterface());
			}
		}, [dispatch, isShowPreCallInterface, participants?.length]);

		useEffect(() => {
			if (focusedScreenShare) {
				const focusedParticipant = participants.find((p) => p.identity === focusedScreenShare?.participant?.identity);

				if (!focusedParticipant?.isScreenShareEnabled) {
					setFocusedScreenShare(null);
				}
			}
		}, [participants, focusedScreenShare]);
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
	activeSoundReactions
}: {
	isAnimationComplete: boolean;
	onPressMinimizeRoom: () => void;
	channelId: string;
	clanId: string;
	onFocusedScreenChange: (track: TrackReference | null) => void;
	isGroupCall?: boolean;
	participantsCount?: number;
	activeSoundReactions: Map<string, ActiveSoundReaction>;
}) => {
	const marginWidth = Dimensions.get('screen').width;
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const voiceInfo = useSelector(selectVoiceInfo);
	const [focusedScreenShare, setFocusedScreenShare] = useState<TrackReference | null>(null);
	const [isHiddenControl, setIsHiddenControl] = useState<boolean>(false);
	const isPiPMode = useAppSelector((state) => selectIsPiPMode(state));
	const screenCaptureRef = React.useRef(null);
	const isShowPreCallInterface = useSelector(selectIsShowPreCallInterface);

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
			disableScrollView: true,
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
			</View>
		);
	}

	return (
		<View style={[styles.roomViewContainer, isPiPMode && styles.roomViewContainerPiP]}>
			{!isAnimationComplete ? (
				<FocusedScreenPopup />
			) : (
				<ParticipantScreen setFocusedScreenShare={setFocusedScreenShareProp} activeSoundReactions={activeSoundReactions} />
			)}
			{isAnimationComplete && isGroupCall && isShowPreCallInterface && (
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
			<RoomViewListener
				isShowPreCallInterface={isShowPreCallInterface}
				focusedScreenShare={focusedScreenShare}
				setFocusedScreenShare={setFocusedScreenShareProp}
			/>
		</View>
	);
};

export default React.memo(RoomView);
