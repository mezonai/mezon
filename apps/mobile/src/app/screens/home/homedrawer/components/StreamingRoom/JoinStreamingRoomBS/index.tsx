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
	selectStreamMembersByChannelId,
	useAppDispatch,
	videoStreamActions
} from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { useWebRTCStream } from '../../../../../../components/StreamContext/StreamContext';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import VoiceChannelAvatar from '../../ChannelVoice/JoinChannelVoiceBS/VoiceChannelAvatar';
import InviteToChannel from '../../InviteToChannel';
import { style } from './JoinStreamingRoomBS.styles';
function JoinStreamingRoomBS({ channel }: { channel: IChannel }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { dismiss } = useBottomSheetModal();
	const { handleChannelClick } = useWebRTCStream();
	const { t } = useTranslation(['streamingRoom', 'common']);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const playStream = useSelector(selectStatusStream);
	const userProfile = useSelector(selectAllAccount);
	const sessionUser = useSelector(selectSession);
	const channelId = useMemo(() => {
		return channel?.channel_id || channel?.id || '';
	}, [channel?.channel_id, channel?.id]);
	const memberJoin = useSelector((state) => selectStreamMembersByChannelId(state, channelId));
	const badge = useMemo(() => (memberJoin?.length > 3 ? memberJoin.length - 3 : 0), [memberJoin]);

	const handleJoinVoice = () => {
		requestAnimationFrame(async () => {
			if (channel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				if (currentStreamInfo?.streamId !== channelId || (!playStream && currentStreamInfo?.streamId === channelId)) {
					handleChannelClick(
						channel?.clan_id,
						channelId,
						userProfile?.user?.id,
						channelId,
						userProfile?.user?.username,
						sessionUser?.token as string
					);
					dispatch(
						videoStreamActions.startStream({
							clanId: channel?.clan_id || '0',
							clanName: '',
							streamId: channelId,
							streamName: channel?.channel_label || '',
							parentId: channel?.parent_id || ''
						})
					);
				}
				joinChannel();
			}
		});
	};

	const handleShowChat = async () => {
		if (channel?.type === ChannelType.CHANNEL_TYPE_STREAMING) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
			joinChannel();
		}
	};

	const joinChannel = async () => {
		if (currentClanId !== channel?.clan_id) {
			changeClan(channel.clan_id);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
			isFetchMemberChannelDM: true
		});
		const dataSave = getUpdateOrAddClanChannelCache(channel?.clan_id, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		await jumpToChannel(channelId, channel?.clan_id);
		dismiss();
	};

	return (
		<View style={styles.outerContainer}>
			<View style={styles.topButtonsRow}>
				<View style={styles.headerLeftContent}>
					<TouchableOpacity
						onPress={() => {
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
						}}
						style={styles.buttonCircle}
					>
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} color={themeValue.textStrong} />
					</TouchableOpacity>
					<Text numberOfLines={2} style={[styles.text, styles.textFlexible]}>
						{channel?.channel_label || ''}
					</Text>
				</View>
				<TouchableOpacity
					onPress={() => {
						const data = {
							snapPoints: ['70%', '90%'],
							children: <InviteToChannel isUnknownChannel={false} channelId={channelId} />
						};
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
					}}
					style={styles.btnInviteChannel}
				>
					<MezonIconCDN icon={IconCDN.userPlusIcon} color={themeValue.textStrong} />
				</TouchableOpacity>
			</View>
			<View style={styles.centerContent}>
				<View style={styles.avatarContainer}>
					{memberJoin?.length === 0 ? (
						<View style={styles.iconVoice}>
							<MezonIconCDN icon={IconCDN.channelStream} width={size.s_36} height={size.s_36} color={themeValue.textStrong} />
						</View>
					) : (
						<View style={styles.avatarRow}>
							{memberJoin?.slice?.(0, 3)?.map((m) => {
								return <VoiceChannelAvatar key={`${m?.user_id}_user_join_streaming`} userId={m?.user_id} />;
							})}
							{badge > 0 && (
								<View style={styles.badgeContainer}>
									<Text style={styles.textBadge}>+{badge}</Text>
								</View>
							)}
						</View>
					)}
				</View>
				<Text style={styles.text}>{t('joinStreamingRoomBS.stream')}</Text>
				<Text style={styles.textDisable}>{memberJoin?.length > 0 ? t('common:everyoneWaitingInside') : t('common:noOneInVoice')}</Text>
			</View>
			<View style={styles.controlContainerOuter}>
				<View style={styles.controlContainerInner}>
					<View style={styles.controlContainer} />
					<View style={styles.btnJoinVoiceContainer}>
						<TouchableOpacity
							disabled={!memberJoin?.length}
							style={[styles.btnJoinVoice, !memberJoin?.length && { backgroundColor: themeValue.textDisabled }]}
							onPress={handleJoinVoice}
						>
							<Text style={styles.textBtnJoinVoice}>{t('joinStreamingRoomBS.joinStream')}</Text>
						</TouchableOpacity>
					</View>
					<TouchableOpacity onPress={handleShowChat}>
						<View style={[styles.controlContainer, { backgroundColor: themeValue.tertiary }]}>
							<MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.textStrong} />
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

export default memo(JoinStreamingRoomBS);
