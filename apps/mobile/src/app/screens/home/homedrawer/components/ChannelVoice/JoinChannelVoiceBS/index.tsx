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
import { selectCurrentClanId, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import InviteToChannel from '../../InviteToChannel';
import { style } from './JoinChannelVoiceBS.styles';
import VoiceChannelAvatar from './VoiceChannelAvatar';
function JoinChannelVoiceBS({ channel }: { channel: IChannel }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { dismiss } = useBottomSheetModal();
	const navigation = useNavigation<any>();
	const { t } = useTranslation(['channelVoice', 'common']);
	const currentClanId = useSelector(selectCurrentClanId);
	const channelId = useMemo(() => {
		return channel?.channelId || channel?.id || '';
	}, [channel?.channelId, channel?.id]);

	const voiceChannelMembers = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channelId));
	const badge = useMemo(() => (voiceChannelMembers?.length > 3 ? voiceChannelMembers.length - 3 : 0), [voiceChannelMembers]);

	const handleJoinVoice = async () => {
		if (!channel?.meeting_code) return;

		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, {
			channelId: channelId,
			roomName: channel.meeting_code,
			clanId: currentClanId
		});
		dismiss();
	};

	const handleShowChat = async () => {
		if (channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.CHAT_STREAMING
			});
			joinChannel();
		}
	};

	const joinChannel = async () => {
		if (currentClanId !== channel?.clanId) {
			changeClan(channel.clanId);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, {
			isFetchMemberChannelDM: true
		});
		const dataSave = getUpdateOrAddClanChannelCache(channel?.clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		await jumpToChannel(channelId, channel?.clanId);
		dismiss();
	};

	return (
		<View style={styles.container}>
			<View style={styles.headerRow}>
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
						{channel?.channelLabel || ''}
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
					style={styles.inviteButton}
				>
					<MezonIconCDN icon={IconCDN.userPlusIcon} color={themeValue.textStrong} />
				</TouchableOpacity>
			</View>
			<View style={styles.centerContent}>
				<View style={styles.avatarContainer}>
					{voiceChannelMembers?.length === 0 ? (
						<View style={styles.iconVoice}>
							<MezonIconCDN icon={IconCDN.channelVoice} width={size.s_36} height={size.s_36} color={themeValue.textStrong} />
						</View>
					) : (
						<View style={styles.avatarRow}>
							{voiceChannelMembers?.slice?.(0, 3)?.map((m) => {
								return <VoiceChannelAvatar key={`${m?.userId}_user_join_voice`} userId={m?.userId} />;
							})}
							{badge > 0 && (
								<View style={styles.badgeContainer}>
									<Text style={styles.textBadge}>+{badge}</Text>
								</View>
							)}
						</View>
					)}
				</View>
				<Text style={styles.text}>{t('joinChannelVoiceBS.channelVoice')}</Text>
				<Text style={styles.textDisable}>
					{voiceChannelMembers?.length > 0 ? t('common:everyoneWaitingInside') : t('common:noOneInVoice')}
				</Text>
			</View>
			<View style={styles.controlContainerOuter}>
				<View style={styles.controlContainerInner}>
					<View style={styles.controlContainer}></View>
					<View style={styles.btnJoinVoiceContainer}>
						<TouchableOpacity style={styles.btnJoinVoice} onPress={handleJoinVoice}>
							<Text style={styles.textBtnJoinVoice}>{t('joinChannelVoiceBS.joinVoice')}</Text>
						</TouchableOpacity>
					</View>
					<TouchableOpacity onPress={handleShowChat}>
						<View style={[styles.controlContainer, styles.controlContainerTertiary]}>
							<MezonIconCDN icon={IconCDN.chatIcon} color={themeValue.textStrong} />
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

export default React.memo(JoinChannelVoiceBS);
