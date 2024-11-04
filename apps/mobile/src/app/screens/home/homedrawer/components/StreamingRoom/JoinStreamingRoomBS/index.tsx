import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import {
	ActionEmitEvent,
	Icons,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_PREVIOUS_CHANNEL,
	changeClan,
	getUpdateOrAddClanChannelCache,
	jumpToChannel,
	save
} from '@mezon/mobile-components';
import { Block, baseColor, size, useTheme } from '@mezon/mobile-ui';
import { appActions, selectClanById, useAppDispatch, videoStreamActions } from '@mezon/store';
import { selectCurrentChannel, selectCurrentClanId, selectCurrentStreamInfo, selectStatusStream } from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { MezonBottomSheet } from '../../../../../../componentUI';
import { IModeKeyboardPicker } from '../../BottomKeyboardPicker';
import { InviteToChannel } from '../../InviteToChannel';
import { ChatBoxStreamComponent } from '../ChatBoxStream';
import FooterChatBoxStream from '../ChatBoxStream/FooterChatBoxStream';
import { style } from './JoinStreamingRoomBS.styles';

function JoinStreamingRoomBS({ channel }: { channel: IChannel }, refRBSheet: React.MutableRefObject<BottomSheetModal>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const bottomSheetInviteRef = useRef(null);
	const { dismiss } = useBottomSheetModal();
	const { t } = useTranslation(['streamingRoom']);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const playStream = useSelector(selectStatusStream);
	const dispatch = useAppDispatch();
	const clanById = useSelector(selectClanById(channel?.clan_id || ''));
	const bottomSheetChatRef = useRef(null);
	const panelKeyboardRef = useRef(null);

	const handleJoinVoice = async () => {
		requestAnimationFrame(async () => {
			if (channel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				dispatch(appActions.setHiddenBottomTabMobile(true));
				if (currentStreamInfo?.streamId !== channel?.id || (!playStream && currentStreamInfo?.streamId === channel?.id)) {
					dispatch(
						videoStreamActions.startStream({
							clanId: channel?.clan_id || '',
							clanName: clanById?.clan_name || '',
							streamId: channel?.channel_id || '',
							streamName: channel?.channel_label || '',
							parentId: channel?.parrent_id || ''
						})
					);
				}

				save(STORAGE_PREVIOUS_CHANNEL, currentChannel);
				const clanId = channel?.clan_id;
				const channelId = channel?.channel_id;

				if (currentClanId !== clanId) {
					changeClan(clanId);
				}
				DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
					isFetchMemberChannelDM: true
				});
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
				await jumpToChannel(channelId, clanId);
				dismiss();
			}
		});
	};

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, height: number, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, height, type);
		}
	}, []);

	const handleShowChat = () => {
		bottomSheetChatRef.current.present();
	};

	return (
		<Block width={'100%'} paddingVertical={size.s_10} paddingHorizontal={size.s_10}>
			<Block flexDirection="row" justifyContent="space-between">
				<TouchableOpacity
					onPress={() => {
						refRBSheet?.current.dismiss();
					}}
					style={styles.buttonCircle}
				>
					<Icons.ChevronSmallDownIcon />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => {
						bottomSheetInviteRef.current.present();
					}}
					style={{
						backgroundColor: themeValue.tertiary,
						padding: size.s_8,
						borderRadius: size.s_22
					}}
				>
					<Icons.UserPlusIcon />
				</TouchableOpacity>
			</Block>
			<Block alignItems="center" gap={size.s_6}>
				<LinearGradient
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					colors={[baseColor.blurple, baseColor.purple, baseColor.blurple, baseColor.purple]} // Các màu cho gradient
					style={{
						width: size.s_100,
						height: size.s_100,
						borderRadius: size.s_50,
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<Icons.VoiceNormalIcon width={size.s_36} height={size.s_36} />
				</LinearGradient>
				<Text style={styles.text}>{t('joinStreamingRoomBS.stream')}</Text>
				<Text style={styles.textDisable}>{t('joinStreamingRoomBS.noOne')}</Text>
				<Text style={styles.textDisable}>{t('joinStreamingRoomBS.readyTalk')}</Text>
			</Block>
			<Block borderRadius={size.s_40} backgroundColor={themeValue.tertiary} marginTop={size.s_20}>
				<TouchableOpacity style={styles.lineBtn}>
					<Block width={size.s_50} height={size.s_6} borderRadius={size.s_4} backgroundColor={themeValue.badgeHighlight}></Block>
				</TouchableOpacity>
				<Block
					gap={size.s_20}
					flexDirection="row"
					alignItems="center"
					justifyContent="space-between"
					paddingHorizontal={size.s_20}
					paddingBottom={size.s_20}
				>
					<Block
						justifyContent="center"
						alignItems="center"
						position="relative"
						width={size.s_60}
						height={size.s_60}
						backgroundColor={'transparent'}
						borderRadius={size.s_30}
					></Block>
					<Block flexDirection="column" flex={1}>
						<TouchableOpacity style={styles.btnJoinVoice} onPress={handleJoinVoice}>
							<Text style={styles.textBtnJoinVoice}>{t('joinStreamingRoomBS.joinStream')}</Text>
						</TouchableOpacity>
					</Block>
					<TouchableOpacity onPress={handleShowChat}>
						<Block
							justifyContent="center"
							alignItems="center"
							position="relative"
							width={size.s_60}
							height={size.s_60}
							backgroundColor={themeValue.badgeHighlight}
							borderRadius={size.s_30}
						>
							<Icons.ChatIcon />
						</Block>
					</TouchableOpacity>
				</Block>
			</Block>
			<MezonBottomSheet
				footer={<FooterChatBoxStream onShowKeyboardBottomSheet={onShowKeyboardBottomSheet} />}
				title={t('chat')}
				titleSize={'md'}
				snapPoints={['90%']}
				ref={bottomSheetChatRef}
			>
				<ChatBoxStreamComponent ref={panelKeyboardRef} />
			</MezonBottomSheet>
			<InviteToChannel isUnknownChannel={false} ref={bottomSheetInviteRef} />
		</Block>
	);
}

export default React.forwardRef(JoinStreamingRoomBS);
