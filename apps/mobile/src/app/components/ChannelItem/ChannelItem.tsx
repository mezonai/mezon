import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelUsersEntity } from '@mezon/store-mobile';
import { clansActions, getStore, selectChannelById, selectCurrentClanId, useAppSelector } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import IconChannel from '../IconChannel';
import style from './ChannelItem.styles';

type ChannelItemProps = {
	channelData?: ChannelUsersEntity;
	onSelectChannel?: (channel: ChannelUsersEntity) => void;
	isHideClanName?: boolean;
};

export const ChannelItem = memo(({ channelData, onSelectChannel, isHideClanName = false }: ChannelItemProps) => {
	const { t } = useTranslation(['searchMessageChannel']);
	const { themeValue } = useTheme();
	const parentChannel = useAppSelector((state) => selectChannelById(state, channelData?.parent_id || ''));
	const parentLabel = useMemo(() => (parentChannel?.channel_label ? `(${parentChannel.channel_label})` : ''), [parentChannel]);
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const handleOnPress = async () => {
		if (onSelectChannel) {
			onSelectChannel(channelData);
			return;
		}
		const store = getStore();
		const clanIdStore = selectCurrentClanId(store.getState());

		if (clanIdStore !== channelData?.clan_id) {
			store.dispatch(clansActions.joinClan({ clanId: channelData?.clan_id }));
			store.dispatch(clansActions.changeCurrentClan({ clanId: channelData?.clan_id }));
		}
		DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_ROUTER, { channel: channelData, isFromSearch: true });
		if (isTabletLandscape) {
			await sleep(200);
			navigation.goBack();
		}
	};

	return (
		<TouchableOpacity onPress={handleOnPress} style={styles.channelItemContainer}>
			{[ChannelType.CHANNEL_TYPE_CHANNEL, ChannelType.CHANNEL_TYPE_THREAD, ChannelType.CHANNEL_TYPE_APP].includes(channelData?.type) ? (
				<View style={styles.channelRow}>
					<IconChannel channelPrivate={channelData?.channel_private} type={channelData?.type} />
					<View>
						<View style={styles.channelInfo}>
							<Text style={styles.channelName} numberOfLines={1}>{`${channelData?.channel_label} ${parentLabel}`}</Text>
						</View>
						{!isHideClanName && !!channelData?.clan_name && <Text style={styles.categoryChannel}>{channelData?.clan_name}</Text>}
					</View>
				</View>
			) : null}
			{[ChannelType.CHANNEL_TYPE_STREAMING, ChannelType.CHANNEL_TYPE_MEZON_VOICE].includes(channelData?.type) ? (
				<View style={styles.voiceChannelContainer}>
					<View style={styles.channelRow}>
						<IconChannel channelPrivate={channelData?.channel_private} type={channelData?.type} />
						<View style={styles.channelNameWrapper}>
							<View style={styles.channelInfo}>
								<Text style={styles.channelName} numberOfLines={1}>
									{channelData?.channel_label}
								</Text>
							</View>
							{!isHideClanName && !!channelData?.clan_name && <Text style={styles.categoryChannel}>{channelData?.clan_name}</Text>}
						</View>
					</View>
					<View style={styles.joinChannelBtn}>
						<MezonIconCDN icon={IconCDN.channelVoice} width={size.s_20} height={size.s_20} color={'#c7c7c7'} />
						<Text style={styles.joinChannelBtnText}>{t('joinChannel')}</Text>
					</View>
				</View>
			) : null}
		</TouchableOpacity>
	);
});
