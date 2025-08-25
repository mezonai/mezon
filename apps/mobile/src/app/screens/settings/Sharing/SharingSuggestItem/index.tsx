import { size, useTheme } from '@mezon/mobile-ui';
import { ClansEntity, getStore, selectChannelById } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../../../assets/Images';
import MezonAvatar from '../../../../componentUI/MezonAvatar';
import { style } from './styles';

type SharingSuggestItemProps = {
	item: any;
	clans: Record<string, ClansEntity>;
	onChooseItem: (item: any) => void;
};
const SharingSuggestItem = memo(({ item, clans, onChooseItem }: SharingSuggestItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const parentLabel = useMemo(() => {
		const store = getStore();
		const state = store.getState();
		const parentChannel = selectChannelById(state, item?.parent_id || '');
		return parentChannel?.channel_label ? `(${parentChannel.channel_label})` : '';
	}, [item?.parent_id]);

	const isGroupDM = useMemo(() => item?.type === ChannelType.CHANNEL_TYPE_GROUP, [item?.type]);
	const isAvatar = useMemo(() => item?.topic && !item?.topic?.includes('avatar-group.png'), [item?.topic]);

	const handleChooseItem = () => {
		onChooseItem(item);
	};

	const data = useMemo(() => {
		if (item?.type === ChannelType.CHANNEL_TYPE_DM) {
			return {
				name: item?.channel_label,
				avatarUrl: item?.channel_avatar?.[0]
			};
		}

		if (item?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			return {
				name: item?.channel_label,
				avatarUrl: item?.topic
			};
		}

		const clan = clans?.[item?.clan_id];
		return {
			name: clan?.clan_name,
			avatarUrl: clan?.logo
		};
	}, [item, clans]);

	return (
		<TouchableOpacity style={styles.itemSuggestion} onPress={handleChooseItem}>
			{isGroupDM && !isAvatar ? (
				<FastImage
					source={Images.AVATAR_GROUP}
					style={{
						width: size.s_24,
						height: size.s_24,
						borderRadius: 50
					}}
				/>
			) : (
				<MezonAvatar avatarUrl={data?.avatarUrl} username={data?.name} width={size.s_24} height={size.s_24} />
			)}
			<Text style={styles.titleSuggestion} numberOfLines={1}>{`${item?.channel_label} ${parentLabel}`}</Text>
		</TouchableOpacity>
	);
});

export default SharingSuggestItem;
