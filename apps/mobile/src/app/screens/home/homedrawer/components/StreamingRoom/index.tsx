import { useAuth } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { baseColor, Block, Metrics, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentStreamInfo, selectStreamMembersByChannelId, useAppDispatch, usersStreamActions, videoStreamActions } from '@mezon/store';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useWebRTCStream } from '../../../../../components/StreamContext/StreamContext';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { InviteToChannel } from '../InviteToChannel';
import { style } from './StreamingRoom.styles';
import { StreamingScreenComponent } from './StreamingScreen';
import UserStreamingRoom from './UserStreamingRoom';

function StreamingRoom({ onPressMinimizeRoom, isAnimationComplete }: { onPressMinimizeRoom: () => void; isAnimationComplete: boolean }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const bottomSheetInviteRef = useRef(null);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const streamChannelMember = useSelector(selectStreamMembersByChannelId(currentStreamInfo?.streamId || ''));

	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { disconnect } = useWebRTCStream();

	const handleLeaveChannel = useCallback(async () => {
		if (currentStreamInfo) {
			dispatch(videoStreamActions.stopStream());
		}
		disconnect();
		const idStreamByMe = streamChannelMember?.find((member) => member?.user_id === userProfile?.user?.id)?.id;
		dispatch(usersStreamActions.remove(idStreamByMe));
	}, [currentStreamInfo, disconnect, streamChannelMember, dispatch, userProfile]);

	const handleEndCall = useCallback(() => {
		requestAnimationFrame(async () => {
			await handleLeaveChannel();
		});
	}, [handleLeaveChannel]);

	const handleAddPeopleToVoice = () => {
		bottomSheetInviteRef.current.present();
	};

	const handleShowChat = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
		});
		onPressMinimizeRoom();
	};

	return (
		<SafeAreaView>
			<Block
				style={{
					width: isAnimationComplete ? Metrics.screenWidth : 200,
					height: isAnimationComplete ? Metrics.screenHeight : 100,
					backgroundColor: themeValue?.primary
				}}
			>
				<Block style={styles.container}>
					{isAnimationComplete && (
						<Block style={[styles.menuHeader]}>
							<Block flexDirection="row" alignItems="center" gap={size.s_20}>
								<TouchableOpacity
									onPress={() => {
										onPressMinimizeRoom();
									}}
									style={styles.buttonCircle}
								>
									<Icons.ChevronSmallDownIcon />
								</TouchableOpacity>
							</Block>
							<Block flexDirection="row" alignItems="center" gap={size.s_20}>
								<TouchableOpacity onPress={handleAddPeopleToVoice} style={styles.buttonCircle}>
									<Icons.UserPlusIcon />
								</TouchableOpacity>
							</Block>
						</Block>
					)}

					<Block
						style={{
							...styles.userStreamingRoomContainer,
							width: isAnimationComplete ? '100%' : '100%',
							height: isAnimationComplete ? '60%' : '100%'
						}}
					>
						<StreamingScreenComponent />
					</Block>
					{isAnimationComplete && <UserStreamingRoom streamChannelMember={streamChannelMember} />}
					{isAnimationComplete && (
						<Block style={[styles.menuFooter]}>
							<Block borderRadius={size.s_40} backgroundColor={themeValue.secondary}>
								<Block gap={size.s_40} flexDirection="row" alignItems="center" justifyContent="space-between" padding={size.s_14}>
									<TouchableOpacity onPress={handleShowChat} style={styles.menuIcon}>
										<Icons.ChatIcon />
									</TouchableOpacity>

									<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
										<Icons.PhoneCallIcon />
									</TouchableOpacity>
								</Block>
							</Block>
						</Block>
					)}
				</Block>
				<InviteToChannel isUnknownChannel={false} ref={bottomSheetInviteRef} />
			</Block>
		</SafeAreaView>
	);
}

export default React.memo(StreamingRoom);
