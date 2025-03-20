import { Icons, STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	selectCurrentStreamInfo,
	selectStreamMembersByChannelId,
	useAppDispatch,
	useAppSelector,
	usersStreamActions,
	videoStreamActions
} from '@mezon/store';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { useWebRTCStream } from '../../../../../components/StreamContext/StreamContext';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './StreamingRoom.styles';
import { StreamingScreenComponent } from './StreamingScreen';
import UserStreamingRoom from './UserStreamingRoom';

const { width, height } = Dimensions.get('window');

function StreamingRoom({ onPressMinimizeRoom, isAnimationComplete }: { onPressMinimizeRoom: () => void; isAnimationComplete: boolean }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const streamChannelMember = useAppSelector((state) => selectStreamMembersByChannelId(state, currentStreamInfo?.streamId || ''));
	const isTabletLandscape = useTabletLandscape();

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
				width: isAnimationComplete ? width : 200,
				height: isAnimationComplete ? height : 100,
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
								<Icons.ChevronSmallDownIcon />
							</TouchableOpacity>
						</View>
						{/*<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_20 }}>*/}
						{/*	<TouchableOpacity onPress={handleAddPeopleToVoice} style={styles.buttonCircle}>*/}
						{/*		<Icons.UserPlusIcon />*/}
						{/*	</TouchableOpacity>*/}
						{/*</View>*/}
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
									<Icons.ChatIcon />
								</TouchableOpacity>

								<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
									<Icons.PhoneCallIcon />
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
