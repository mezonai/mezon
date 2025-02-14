import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	Icons,
	load,
	save,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { channelsActions, ChannelsEntity, getStoreAsync, selectAllChannelsFavorite } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MezonBottomSheet } from '../../../../../../componentUI';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../../../../../utils/helpers';
import JoinChannelVoiceBS from '../../ChannelVoice/JoinChannelVoiceBS';
import JoinStreamingRoomBS from '../../StreamingRoom/JoinStreamingRoomBS';
import { StatusVoiceChannel } from '../ChannelListItem';
import { ChannelFavoriteItem } from './ChannelFavoriteItem';
import { style } from './styles';

export const ChannelListFavorite = React.memo(() => {
	const channelFavorites = useSelector(selectAllChannelsFavorite);
	const bottomSheetChannelStreamingRef = useRef<BottomSheetModal>(null);
	const [currentChannel, setCurrentChannel] = useState<ChannelsEntity>();

	const { themeValue } = useTheme();
	const [isCollapse, setIsCollapse] = useState<boolean>(false);
	const styles = style(themeValue);
	const { t } = useTranslation('channelMenu');
	const handleCollapse = () => {
		setIsCollapse(!isCollapse);
	};
	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const timeoutRef = useRef<any>();

	useEffect(() => {
		return () => {
			timeoutRef.current && clearTimeout(timeoutRef.current);
		};
	}, []);

	const handleScrollToChannelFavorite = useCallback(
		async (channel?: ChannelsEntity) => {
			if (channel?.type === ChannelType.CHANNEL_TYPE_STREAMING || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
				setCurrentChannel(channel);
				bottomSheetChannelStreamingRef.current?.present();
				return;
			}
			if (channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
				if (channel?.status === StatusVoiceChannel.Active && channel?.meeting_code) {
					const urlVoice = `${linkGoogleMeet}${channel?.meeting_code}`;
					await Linking.openURL(urlVoice);
				}
			} else {
				const channelId = channel?.channel_id || '';
				const clanId = channel?.clan_id || '';
				const store = await getStoreAsync();
				const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];
				const isCached = channelsCache?.includes(channelId);
				store.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId }));
				navigation.navigate(APP_SCREEN.HOME_DEFAULT);
				store.dispatch(channelsActions.setIdChannelSelected({ clanId, channelId }));
				timeoutRef.current = setTimeout(async () => {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_SWITCH_CHANEL, isCached ? 100 : 0);
					store.dispatch(
						channelsActions.joinChannel({
							clanId: clanId ?? '',
							channelId: channelId,
							noFetchMembers: false,
							isClearMessage: true,
							noCache: true
						})
					);
				}, 0);
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			}
		},
		[navigation]
	);

	return (
		<View>
			{channelFavorites?.length ? (
				<View style={{ width: '100%', paddingHorizontal: size.s_8, paddingVertical: size.s_10 }}>
					<TouchableOpacity onPress={handleCollapse} style={styles.categoryItem}>
						<Icons.ChevronSmallDownIcon
							width={size.s_20}
							height={size.s_20}
							color={themeValue.text}
							style={[isCollapse && { transform: [{ rotate: '-90deg' }] }]}
						/>
						<Text style={styles.categoryItemTitle}>{t('favoriteChannel')}</Text>
					</TouchableOpacity>
					<View
						style={{
							display: isCollapse ? 'none' : 'flex'
						}}
					>
						{channelFavorites?.length
							? channelFavorites?.map((channelId: string, index: number) => (
									<View>
										<ChannelFavoriteItem
											onPress={handleScrollToChannelFavorite}
											channelId={channelId}
											key={`${index}_${channelId}_ChannelItemFavorite`}
										/>
										<MezonBottomSheet ref={bottomSheetChannelStreamingRef} snapPoints={['45%']}>
											{currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
												<JoinStreamingRoomBS channel={currentChannel} ref={bottomSheetChannelStreamingRef} />
											) : (
												<JoinChannelVoiceBS channel={currentChannel} ref={bottomSheetChannelStreamingRef} />
											)}
										</MezonBottomSheet>
									</View>
								))
							: null}
					</View>
				</View>
			) : null}
		</View>
	);
});
