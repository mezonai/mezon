import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import MezonInput from '../../../componentUI/MezonInput';
import { Icons } from '../../../componentUI/MobileIcons';
import { style } from './styles';

interface IBottomsheetSelectChannelProps {
	data: ChannelsEntity[];
	onSelect: (item: ChannelsEntity) => void;
	selectedChannelId: string;
}

const BottomsheetSelectChannel = ({ data, onSelect, selectedChannelId }: IBottomsheetSelectChannelProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['eventCreator']);
	const [searchText, setSearchText] = useState<string>('');

	const handleSearchText = debounce((value: string) => {
		setSearchText(value);
	}, 500);

	const filteredOptionsChannels = useMemo(() => {
		return data?.filter((user) => user?.channel_label.toLowerCase().includes(searchText.toLowerCase())) || [];
	}, [searchText, data]);

	const channelIcon = (type: ChannelType, isPrivate: boolean) => {
		if (type === ChannelType.CHANNEL_TYPE_CHANNEL) {
			if (isPrivate) {
				return <Icons.ClansLockIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />;
			}
			return <Icons.ClansOpenIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />;
		} else {
			if (isPrivate) {
				return <Icons.ThreadIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />;
			}
			return <Icons.ThreadIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />;
		}
	};

	const renderItem = ({ item }: { item: ChannelsEntity }) => {
		return (
			<Pressable onPress={() => onSelect(item)} style={[styles.items, item?.channel_id === selectedChannelId && styles.itemsSelected]}>
				{channelIcon(item?.type, item?.channel_private === ChannelStatusEnum.isPrivate)}
				<Text style={styles.inputValue} numberOfLines={1} ellipsizeMode="tail">
					{item?.channel_label}
				</Text>
			</Pressable>
		);
	};

	return (
		<View style={styles.bottomSheetContainer}>
			<MezonInput
				inputWrapperStyle={styles.searchText}
				placeHolder={t('selectUser')}
				onTextChange={handleSearchText}
				prefixIcon={<Icons.SearchIcon color={themeValue.text} width={size.s_20} height={size.s_20} />}
			/>
			<View style={styles.bottomSheetContent}>
				<FlatList
					keyExtractor={(item) => item?.channel_id}
					data={filteredOptionsChannels}
					contentContainerStyle={{ flexGrow: 1 }}
					renderItem={renderItem}
				/>
			</View>
		</View>
	);
};

export default BottomsheetSelectChannel;
