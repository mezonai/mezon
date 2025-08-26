import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelUsersEntity, clansActions, getStore, selectChannelById, selectCurrentClanId, useAppSelector } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import IconChannel from '../IconChannel';
import style from './ChannelItem.styles';

type ChannelItemProps = {
	channelData?: ChannelUsersEntity;
};

export const ChannelItem = React.memo(({ channelData }: ChannelItemProps) => {
	const { t } = useTranslation(['searchMessageChannel']);
	const { themeValue } = useTheme();
	const parentChannel = useAppSelector((state) => selectChannelById(state, channelData?.parent_id || ''));
	const parentLabel = useMemo(() => (parentChannel?.channel_label ? `(${parentChannel.channel_label})` : ''), [parentChannel]);
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const handleOnPress = async () => {
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
		<TouchableOpacity onPress={handleOnPress} style={{ marginBottom: size.s_20 }}>
			{[ChannelType.CHANNEL_TYPE_CHANNEL, ChannelType.CHANNEL_TYPE_THREAD, ChannelType.CHANNEL_TYPE_APP].includes(channelData?.type) ? (
				<View style={{ flexDirection: 'row', gap: size.s_10, alignItems: 'center' }}>
					<IconChannel channelPrivate={channelData?.channel_private} type={channelData?.type} />
					<View>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_6, marginBottom: size.s_2 }}>
							<Text style={styles.channelName} numberOfLines={1}>{`${channelData?.channel_label} ${parentLabel}`}</Text>
						</View>
						{!!channelData?.clan_name && <Text style={styles.categoryChannel}>{channelData?.clan_name}</Text>}
					</View>
				</View>
			) : null}
			{[ChannelType.CHANNEL_TYPE_GMEET_VOICE, ChannelType.CHANNEL_TYPE_STREAMING, ChannelType.CHANNEL_TYPE_MEZON_VOICE].includes(
				channelData?.type
			) ? (
				<View style={{ flexDirection: 'row', gap: size.s_10, alignItems: 'center', justifyContent: 'space-between' }}>
					<View style={{ flexDirection: 'row', gap: size.s_10, alignItems: 'center' }}>
						<IconChannel channelPrivate={channelData?.channel_private} type={channelData?.type} />
						<View>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_6, marginBottom: size.s_2 }}>
								<Text style={styles.channelName} numberOfLines={1}>
									{channelData?.channel_label}
								</Text>
								<MezonIconCDN icon={IconCDN.lockIcon} width={10} height={10} color={'#c7c7c7'} />
							</View>
							{!!channelData?.clan_name && <Text style={styles.categoryChannel}>{channelData?.clan_name}</Text>}
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
