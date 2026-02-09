import { ChannelTypeHeader } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelUsersEntity } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ChannelItem } from '../ChannelItem';
import { EmptySearchPage } from '../EmptySearchPage';
import style from './ChannelsSearchTab.styles';

type ChannelsSearchTabProps = {
	listChannelSearch: ChannelUsersEntity[];
};

const TEXT_CHANNEL_TYPES = [
	ChannelType.CHANNEL_TYPE_CHANNEL,
	ChannelType.CHANNEL_TYPE_THREAD,
	ChannelType.CHANNEL_TYPE_APP,
	ChannelType.CHANNEL_TYPE_ANNOUNCEMENT,
	ChannelType.CHANNEL_TYPE_FORUM
];

const ListEmpty = memo(() => <EmptySearchPage />);

export const ChannelsSearchTab = memo(({ listChannelSearch }: ChannelsSearchTabProps) => {
	const { t } = useTranslation(['searchMessageChannel']);
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue), [themeValue]);

	const listVoiceChannel = useMemo(
		() => listChannelSearch?.filter((channel) => channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE),
		[listChannelSearch]
	);
	const listTextChannel = useMemo(() => listChannelSearch?.filter((channel) => TEXT_CHANNEL_TYPES.includes(channel?.type)), [listChannelSearch]);
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

	const renderItem = useCallback(
		({ item }) => {
			if (item?.type === ChannelTypeHeader) {
				return <Text style={styles.title}>{item.title}</Text>;
			}
			return <ChannelItem channelData={item} />;
		},
		[styles.title]
	);
	const keyExtractor = useCallback((item, index) => `${item?.id?.toString()}${index}_item_search_channel${item?.title}`, []);

	const flatListData = listChannelSearch?.length > 0 ? combinedListChannel : emptyArray;

	return (
		<View style={styles.container}>
			<FlatList
				data={flatListData}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				showsVerticalScrollIndicator={false}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={7}
				updateCellsBatchingPeriod={50}
				scrollEventThrottle={16}
				removeClippedSubviews={true}
				keyboardShouldPersistTaps={'handled'}
				viewabilityConfig={viewabilityConfig}
				style={styles.listBox}
				contentContainerStyle={internalStyles.contentContainer}
				ListEmptyComponent={ListEmpty}
			/>
		</View>
	);
});

const emptyArray: ChannelUsersEntity[] = [];

const viewabilityConfig = {
	itemVisiblePercentThreshold: 50,
	minimumViewTime: 300
};

const internalStyles = StyleSheet.create({
	contentContainer: { paddingBottom: size.s_50 }
});
