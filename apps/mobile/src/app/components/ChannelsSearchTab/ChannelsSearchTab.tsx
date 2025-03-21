import { ActionEmitEvent, ChannelTypeHeader, STORAGE_DATA_CLAN_CHANNEL_CACHE, getUpdateOrAddClanChannelCache, save } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelUsersEntity, channelsActions, clansActions, getStoreAsync, selectCurrentClanId } from '@mezon/store-mobile';
import { ChannelThreads } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, FlatList, Keyboard, Linking, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../utils/helpers';
import { ChannelItem } from '../ChannelItem';
import { EmptySearchPage } from '../EmptySearchPage';
import style from './ChannelsSearchTab.styles';

type ChannelsSearchTabProps = {
	listChannelSearch: ChannelUsersEntity[];
};

export const ChannelsSearchTab = ({ listChannelSearch }: ChannelsSearchTabProps) => {
	const { t } = useTranslation(['searchMessageChannel']);
	const currentClanId = useSelector(selectCurrentClanId);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const timeoutRef = useRef<NodeJS.Timeout>();
	const navigation = useNavigation<any>();
	const listVoiceChannel = useMemo(
		() =>
			listChannelSearch?.filter(
				(channel) => channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
			),
		[listChannelSearch]
	);
	const listTextChannel = useMemo(
		() =>
			listChannelSearch?.filter((channel) =>
				[
					ChannelType.CHANNEL_TYPE_CHANNEL,
					ChannelType.CHANNEL_TYPE_THREAD,
					ChannelType.CHANNEL_TYPE_APP,
					ChannelType.CHANNEL_TYPE_ANNOUNCEMENT,
					ChannelType.CHANNEL_TYPE_FORUM
				].includes(channel?.type)
			),
		[listChannelSearch]
	);
	const listStreamingChannel = useMemo(
		() => listChannelSearch?.filter((channel) => channel?.type === ChannelType.CHANNEL_TYPE_STREAMING),
		[listChannelSearch]
	);
	const combinedListChannel = useMemo(
		() => [
			...(listTextChannel?.length ? [{ title: t('textChannels'), type: ChannelTypeHeader }, ...listTextChannel] : []),
			...(listVoiceChannel?.length ? [{ title: t('voiceChannels'), type: ChannelTypeHeader }, ...listVoiceChannel] : []),
			...(listStreamingChannel?.length ? [{ title: t('streamingChannels'), type: ChannelTypeHeader }, ...listStreamingChannel] : [])
		],
		[listTextChannel, listVoiceChannel, listStreamingChannel, t]
	);

	const renderItem = ({ item }) => {
		if (item?.type === ChannelTypeHeader) {
			return <Text style={styles.title}>{item.title}</Text>;
		}
		return <ChannelItem channelData={item} key={item?.id} />;
	};

	return (
		<View style={styles.container}>
			{listChannelSearch?.length > 0 ? (
				<View
					style={{
						paddingBottom: size.s_100
					}}
				>
					<FlatList
						data={combinedListChannel}
						renderItem={renderItem}
						keyExtractor={(item) => (item?.id ? item?.id.toString() : item.title)}
						onScrollBeginDrag={Keyboard.dismiss}
						keyboardShouldPersistTaps={'handled'}
						contentContainerStyle={{ paddingBottom: size.s_50 }}
						showsVerticalScrollIndicator={false}
						removeClippedSubviews={true}
					/>
				</View>
			) : (
				<EmptySearchPage />
			)}
		</View>
	);
};
