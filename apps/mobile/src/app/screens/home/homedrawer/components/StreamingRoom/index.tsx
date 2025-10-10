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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
	const [isVisibleControl, setIsVisibleControl] = useState(true);
	const [layout, setLayout] = useState(() => {
		const window = Dimensions.get('window');
		return {
			width: window.width,
			height: window.height,
			isLandscape: window.width > window.height
		};
	});

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ window }) => {
			setLayout({
				width: window.width,
				height: window.height,
				isLandscape: window.width > window.height
			});
		});
		return () => subscription?.remove();
	}, []);

	const { width, height, isLandscape } = layout;

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

	const toggleControl = () => {
		setIsVisibleControl(!isVisibleControl);
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
			{isAnimationComplete ? (
				<TouchableWithoutFeedback onPress={toggleControl}>
					<View style={styles.container}>
						<View style={[styles.menuHeader]}>
							<View style={styles.menuHeaderContainer}>
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

						<View
							style={{
								...styles.userStreamingRoomContainer,
								width: '100%',
								height: '60%'
							}}
						>
							<StreamingScreenComponent />
						</View>
						<View style={[isLandscape && { marginTop: -size.s_28 }]}>
							<UserStreamingRoom streamChannelMember={streamChannelMember} />
						</View>

						{isVisibleControl && (
							<View style={[styles.menuFooter]}>
								<View style={styles.menuFooterContainer}>
									<View style={styles.controlContainer}>
										<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
											<MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.text} />
										</TouchableOpacity>

										<TouchableOpacity
											onPress={handleEndCall}
											style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}
										>
											<MezonIconCDN icon={IconCDN.phoneCallIcon} />
										</TouchableOpacity>
									</View>
								</View>
							</View>
						)}
					</View>
				</TouchableWithoutFeedback>
			) : (
				<View style={styles.container}>
					<View
						style={{
							...styles.userStreamingRoomContainer,
							width: '100%',
							height: '100%'
						}}
					>
						<StreamingScreenComponent />
					</View>
				</View>
			)}
		</View>
	);
}

export default React.memo(StreamingRoom);
