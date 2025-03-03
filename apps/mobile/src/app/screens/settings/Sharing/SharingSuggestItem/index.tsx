import { size } from '@mezon/mobile-ui';
import { ClansEntity, selectChannelById, useAppSelector } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { MezonAvatar } from '../../../../componentUI';
import { styles } from './styles';

type SharingSuggestItemProps = {
	item: any;
	clans: Record<string, ClansEntity>;
	onChooseItem: (item: any) => void;
};
const SharingSuggestItem = memo(({ item, clans, onChooseItem }: SharingSuggestItemProps) => {
	const parentChannel = useAppSelector((state) => selectChannelById(state, item?.parent_id || ''));
	const parentLabel = useMemo(() => (parentChannel?.channel_label ? `(${parentChannel.channel_label})` : ''), [parentChannel]);

	const handleChooseItem = () => {
		onChooseItem(item);
	};

	return (
		<TouchableOpacity style={styles.itemSuggestion} onPress={handleChooseItem}>
			<MezonAvatar
				avatarUrl={item?.channel_avatar?.[0] || clans?.[item?.clan_id]?.logo}
				username={clans?.[item?.clan_id]?.clan_name || item?.channel_label}
				width={size.s_24}
				height={size.s_24}
			/>
			<Text style={styles.titleSuggestion} numberOfLines={1}>{`${item?.channel_label} ${parentLabel}`}</Text>
		</TouchableOpacity>
	);
});

export default SharingSuggestItem;
