import { STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	selectCurrentStreamInfo,
	selectStreamMembersByChannelId,
	useAppDispatch,
	useAppSelector,
	usersStreamActions,
	videoStreamActions
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { useWebRTCStream } from '../../../../../components/StreamContext/StreamContext';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './StreamingRoom.styles';
import { StreamingScreenComponent } from './StreamingScreen';
import UserStreamingRoom from './UserStreamingRoom';

function StreamingRoom({ onPressMinimizeRoom, isAnimationComplete }: { onPressMinimizeRoom: () => void; isAnimationComplete: boolean }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const streamChannelMember = useAppSelector((state) => selectStreamMembersByChannelId(state, currentStreamInfo?.streamId || ''));
	const isTabletLandscape = useTabletLandscape();
	const { width, height } = useWindowDimensions();

	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { disconnect } = useWebRTCStream();

	const handleLeaveChannel = useCallback(async () => {
		if (currentStreamInfo) {
			dispatch(videoStreamActions.stopStream());
		}
		disconnect();
		const idStreamByMe = streamChannelMember?.find((member) => member?.user_id === userId)?.id;
		dispatch(usersStreamActions.remove(idStreamByMe));
	}, [currentStreamInfo, disconnect, streamChannelMember, dispatch, userId]);

	const handleEndCall = useCallback(() => {
		requestAnimationFrame(async () => {
			await handleLeaveChannel();
		});
	}, [handleLeaveChannel]);

	const handleShowChat = () => {
		if (!isTabletLandscape) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
		}
		onPressMinimizeRoom();
	};

	return (
		<View
			style={{
				width: isAnimationComplete ? width : size.s_100 * 2,
				height: isAnimationComplete ? height : size.s_100,
				backgroundColor: themeValue?.primary
			}}
		>
			{isAnimationComplete && <StatusBarHeight />}
			<View style={styles.container}>
				{isAnimationComplete && (
					<View style={[styles.menuHeader]}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20 }}>
							<TouchableOpacity
								onPress={() => {
									onPressMinimizeRoom();
								}}
								style={styles.buttonCircle}
							>
								<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} />
							</TouchableOpacity>
						</View>
					</View>
				)}

				<View
					style={{
						...styles.userStreamingRoomContainer,
						width: isAnimationComplete ? '100%' : '100%',
						height: isAnimationComplete ? '60%' : '100%'
					}}
				>
					<StreamingScreenComponent />
				</View>
				{isAnimationComplete && <UserStreamingRoom streamChannelMember={streamChannelMember} />}
				{isAnimationComplete && (
					<View style={[styles.menuFooter]}>
						<View style={{ borderRadius: size.s_40, backgroundColor: themeValue.secondary }}>
							<View
								style={{
									gap: size.s_40,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: size.s_14
								}}
							>
								<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
									<MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.text} />
								</TouchableOpacity>

								<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
									<MezonIconCDN icon={IconCDN.phoneCallIcon} />
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
			</View>
		</View>
	);
}

export default React.memo(StreamingRoom);
