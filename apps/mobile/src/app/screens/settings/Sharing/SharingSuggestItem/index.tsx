import { size, useTheme } from '@mezon/mobile-ui';
import type { ClansEntity } from '@mezon/store-mobile';
import { getStore, selectChannelById } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../../../assets/Images';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import { style } from './styles';
interface ISharingSuggestItemProps {
	item: any;
	clans: Record<string, ClansEntity>;
	onChooseItem: (item: any) => void;
}

const SharingSuggestItem = memo(({ item, clans, onChooseItem }: ISharingSuggestItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const parentLabel = useMemo(() => {
		const store = getStore();
		const state = store.getState();
		const parentChannel = selectChannelById(state, item?.parentId || '');
		return parentChannel?.channelLabel ? `(${parentChannel.channelLabel})` : '';
	}, [item?.parentId]);

	const shouldRenderDefaultAvatarGroup = useMemo(() => {
		return item?.type === ChannelType.CHANNEL_TYPE_GROUP && item?.channelAvatar?.includes('avatar-group.png');
	}, [item?.channelAvatar, item?.type]);

	const suggestionAvatar = useMemo(() => {
		switch (item?.type) {
			case ChannelType.CHANNEL_TYPE_DM:
				return item?.avatars?.[0] || '';

			case ChannelType.CHANNEL_TYPE_GROUP:
				return item?.channelAvatar || '';

			default: {
				return clans?.[item?.clanId]?.logo || '';
			}
		}
	}, [clans, item?.avatars, item?.channelAvatar, item?.clanId, item?.type]);

	const suggestionUsername = useMemo(() => {
		if (item?.type === ChannelType.CHANNEL_TYPE_DM || item?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			return item?.usernames?.[0] || '';
		}
		return clans?.[item?.clanId]?.clanName || '';
	}, [clans, item?.clanId, item?.type, item?.usernames]);

	return (
		<TouchableOpacity style={styles.itemSuggestion} onPress={() => onChooseItem(item)}>
			{shouldRenderDefaultAvatarGroup ? (
				<FastImage source={Images.AVATAR_GROUP} style={styles.avatarImage} />
			) : (
				<View style={styles.avatarImage}>
					<MezonClanAvatar image={suggestionAvatar} alt={suggestionUsername} customFontSizeAvatarCharacter={size.h5} />
				</View>
			)}
			<Text style={styles.titleSuggestion} numberOfLines={1}>{`${item?.channelLabel} ${parentLabel}`}</Text>
		</TouchableOpacity>
	);
});

export default SharingSuggestItem;
