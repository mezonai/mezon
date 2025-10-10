import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import {
	ActionEmitEvent,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	changeClan,
	getUpdateOrAddClanChannelCache,
	jumpToChannel,
	save
} from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	selectAllAccount,
	selectCurrentClanId,
	selectCurrentStreamInfo,
	selectSession,
	selectStatusStream,
	useAppDispatch,
	videoStreamActions
} from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { useWebRTCStream } from '../../../../../../components/StreamContext/StreamContext';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import InviteToChannel from '../../InviteToChannel';
import { style } from './JoinStreamingRoomBS.styles';
function JoinStreamingRoomBS({ channel }: { channel: IChannel }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { dismiss } = useBottomSheetModal();
	const { t } = useTranslation(['streamingRoom']);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const playStream = useSelector(selectStatusStream);
	const dispatch = useAppDispatch();
	const { handleChannelClick } = useWebRTCStream();
	const userProfile = useSelector(selectAllAccount);
	const sessionUser = useSelector(selectSession);

	const handleJoinVoice = () => {
		requestAnimationFrame(async () => {
			if (channel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				if (currentStreamInfo?.streamId !== channel?.id || (!playStream && currentStreamInfo?.streamId === channel?.id)) {
					handleChannelClick(
						channel?.clan_id as string,
						channel?.channel_id as string,
						userProfile?.user?.id as string,
						channel?.channel_id as string,
						userProfile?.user?.username,
						sessionUser?.token as string
					);
					dispatch(
						videoStreamActions.startStream({
							clanId: channel?.clan_id || '',
							clanName: '',
							streamId: channel?.channel_id || '',
							streamName: channel?.channel_label || '',
							parentId: channel?.parent_id || ''
						})
					);
				}
				joinChannel();
			}
		});
	};

	const navigation = useNavigation<any>();

	const handleShowChat = async () => {
		if (channel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
			joinChannel();
		}
	};

	const joinChannel = async () => {
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
	};

	return (
		<View style={{ width: '100%', paddingVertical: size.s_10, paddingHorizontal: size.s_10 }}>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
				<TouchableOpacity
					onPress={() => {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					}}
					style={styles.buttonCircle}
				>
					<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} color={themeValue.textStrong} />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => {
						const data = {
							snapPoints: ['70%', '90%'],
							children: <InviteToChannel isUnknownChannel={false} />
						};
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
					}}
					style={{
						backgroundColor: themeValue.tertiary,
						padding: size.s_8,
						borderRadius: size.s_22
					}}
				>
					<MezonIconCDN icon={IconCDN.userPlusIcon} color={themeValue.textStrong} />
				</TouchableOpacity>
			</View>
			<View style={{ alignItems: 'center', gap: size.s_6 }}>
				<View
					style={{
						width: size.s_100,
						height: size.s_100,
						borderRadius: size.s_50,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: themeValue.tertiary
					}}
				>
					<MezonIconCDN icon={IconCDN.channelVoice} width={size.s_36} height={size.s_36} color={themeValue.textStrong} />
				</View>
				<Text style={styles.text}>{t('joinStreamingRoomBS.stream')}</Text>
				<Text style={styles.textDisable}>{t('joinStreamingRoomBS.noOne')}</Text>
				<Text style={styles.textDisable}>{t('joinStreamingRoomBS.readyTalk')}</Text>
			</View>
			<View style={{ borderRadius: size.s_40, marginTop: size.s_20, marginBottom: size.s_10 }}>
				<View
					style={{
						gap: size.s_20,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingBottom: size.s_16
					}}
				>
					<View
						style={{
							justifyContent: 'center',
							alignItems: 'center',
							position: 'relative',
							width: size.s_50,
							height: size.s_50,
							backgroundColor: 'transparent',
							borderRadius: size.s_30
						}}
					/>
					<View style={{ flexDirection: 'column', flex: 1, alignItems: 'center' }}>
						<TouchableOpacity style={styles.btnJoinVoice} onPress={handleJoinVoice}>
							<Text style={styles.textBtnJoinVoice}>{t('joinStreamingRoomBS.joinStream')}</Text>
						</TouchableOpacity>
					</View>
					<TouchableOpacity onPress={handleShowChat}>
						<View
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								position: 'relative',
								width: size.s_50,
								height: size.s_50,
								backgroundColor: themeValue.border,
								borderRadius: size.s_30
							}}
						>
							<MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.textStrong} />
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

export default React.memo(JoinStreamingRoomBS);
