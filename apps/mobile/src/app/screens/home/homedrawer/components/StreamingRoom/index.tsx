import { useAuth } from '@mezon/core';
import {
	ActionEmitEvent,
	changeClan,
	getUpdateOrAddClanChannelCache,
	Icons,
	jumpToChannel,
	load,
	remove,
	save,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_PREVIOUS_CHANNEL
} from '@mezon/mobile-components';
import { baseColor, Block, Metrics, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentStreamInfo, selectStreamMembersByChannelId, useAppDispatch, usersStreamActions, videoStreamActions } from '@mezon/store';
import { selectCurrentClanId } from '@mezon/store-mobile';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, SafeAreaView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { MezonBottomSheet } from '../../../../../componentUI';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { IModeKeyboardPicker } from '../BottomKeyboardPicker';
import { InviteToChannel } from '../InviteToChannel';
import { ChatBoxStreamComponent } from './ChatBoxStream';
import FooterChatBoxStream from './ChatBoxStream/FooterChatBoxStream';
import { style } from './StreamingRoom.styles';
import { StreamingScreenComponent } from './StreamingScreen';
import UserStreamingRoom from './UserStreamingRoom';

function StreamingRoom({
	onPressMinimizeRoom,
	isAnimationComplete
}: {
	onPressMinimizeRoom: (isAnimationComplete: boolean) => void;
	isAnimationComplete: boolean;
}) {
	const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const bottomSheetInviteRef = useRef(null);
	const bottomSheetChatRef = useRef(null);
	const panelKeyboardRef = useRef(null);
	const { t } = useTranslation(['streamingRoom']);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const streamChannelMember = useSelector(selectStreamMembersByChannelId(currentStreamInfo?.streamId || ''));
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();

	const handleLeaveChannel = async () => {
		if (currentStreamInfo) {
			dispatch(videoStreamActions.stopStream());
		}
		const idStreamByMe = streamChannelMember?.find((member) => member?.user_id === userProfile?.user?.id)?.id;
		dispatch(usersStreamActions.remove(idStreamByMe || ''));
	};

	const handleEndCall = useCallback(() => {
		requestAnimationFrame(async () => {
			handleLeaveChannel();
			const previousChannel = load(STORAGE_PREVIOUS_CHANNEL) || [];
			navigation.navigate(APP_SCREEN.HOME);
			navigation.dispatch(DrawerActions.openDrawer());
			const { channel_id, clan_id } = previousChannel || {};
			if (currentClanId !== clan_id) {
				changeClan(clan_id);
			}
			DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
				isFetchMemberChannelDM: true
			});
			const dataSave = getUpdateOrAddClanChannelCache(clan_id, channel_id);
			save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			jumpToChannel(channel_id, clan_id);
			remove(STORAGE_PREVIOUS_CHANNEL);
		});
	}, []);

	const handleAddPeopleToVoice = () => {
		bottomSheetInviteRef.current.present();
	};
	const handelFullScreenVideo = useCallback(() => {
		setIsFullScreen(!isFullScreen);
	}, [isFullScreen]);
	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, height: number, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, height, type);
		}
	}, []);

	const handleShowChat = () => {
		bottomSheetChatRef.current.present();
	};

	return (
		<SafeAreaView>
			<LinearGradient
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				colors={[baseColor.blurple, baseColor.purple, baseColor.blurple, baseColor.purple]}
				style={{
					width: isAnimationComplete ? (isFullScreen ? Metrics.screenHeight : Metrics.screenWidth) : 200,
					height: isAnimationComplete ? (isFullScreen ? Metrics.screenWidth : Metrics.screenHeight) : 100
				}}
			>
				<Block style={styles.container}>
					{!isFullScreen && isAnimationComplete && (
						<Block style={[styles.menuHeader]}>
							<Block flexDirection="row" alignItems="center" gap={size.s_20}>
								<TouchableOpacity
									onPress={() => {
										onPressMinimizeRoom(false);
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
							width: isAnimationComplete ? (isFullScreen ? '100%' : '100%') : '100%',
							height: isAnimationComplete ? (isFullScreen ? '100%' : '60%') : '100%'
						}}
					>
						<StreamingScreenComponent
							streamID={currentStreamInfo?.streamId}
							isAnimationComplete={isAnimationComplete}
							onFullScreenVideo={handelFullScreenVideo}
						/>
					</Block>
					{!isFullScreen && isAnimationComplete && <UserStreamingRoom streamChannelMember={streamChannelMember} />}
					{!isFullScreen && isAnimationComplete && (
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

				<MezonBottomSheet
					footer={<FooterChatBoxStream onShowKeyboardBottomSheet={onShowKeyboardBottomSheet} />}
					title={t('chat')}
					titleSize={'md'}
					snapPoints={['100%']}
					ref={bottomSheetChatRef}
				>
					<ChatBoxStreamComponent ref={panelKeyboardRef} />
				</MezonBottomSheet>
			</LinearGradient>
		</SafeAreaView>
	);
}

export default React.memo(StreamingRoom);
