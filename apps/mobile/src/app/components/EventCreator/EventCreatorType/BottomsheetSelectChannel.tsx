import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface IBottomsheetSelectChannelProps {
	data: ChannelsEntity[];
	onSelect: (item: ChannelsEntity) => void;
}

const BottomsheetSelectChannel: React.FC<IBottomsheetSelectChannelProps> = ({ data, onSelect }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['eventCreator']);
	const [searchText, setSearchText] = useState<string>('');

	const handleSearchText = debounce((value: string) => {
		setSearchText(value);
	}, 500);

	const filteredOptionsChannels = useMemo(() => {
		return data.filter((user) => user.channel_label.toLowerCase().includes(searchText.toLowerCase()));
	}, [searchText, data]);

	const channelIcon = (type: ChannelType, isPrivate: boolean) => {
		if (type === ChannelType.CHANNEL_TYPE_CHANNEL) {
			if (isPrivate) {
				return <MezonIconCDN icon={IconCDN.channelTextLock} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
			}
			return <MezonIconCDN icon={IconCDN.channelText} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
		} else {
			if (isPrivate) {
				return <MezonIconCDN icon={IconCDN.threadLockIcon} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
			}
			return <MezonIconCDN icon={IconCDN.threadIcon} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
		}
	};

	const renderItem = ({ item }: { item: ChannelsEntity }) => {
		return (
			<Pressable key={`channel_event_${item.channel_id}`} onPress={() => onSelect(item)} style={styles.items}>
				{channelIcon(item.type, item.channel_private === ChannelStatusEnum.isPrivate)}
				<Text style={styles.inputValue} numberOfLines={1} ellipsizeMode="tail">
					{item.channel_label}
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
				prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />}
			/>
			<View style={styles.bottomSheetContent}>
				<FlatList data={filteredOptionsChannels} contentContainerStyle={{ flexGrow: 1 }} renderItem={renderItem} />
			</View>
		</View>
	);
};

export default BottomsheetSelectChannel;
