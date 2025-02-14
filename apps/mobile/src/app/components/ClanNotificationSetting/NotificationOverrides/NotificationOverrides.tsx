import { useCategorizedAllChannels } from '@mezon/core';
import { EOptionOverridesType, Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { IChannel } from '@mezon/utils';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { CategoryChannelItem } from '../CategoryChannelItem';
import { style } from './NotificationOverrides.styles';

const NotificationOverrides = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const categorizedChannels = useCategorizedAllChannels();
	const [searchText, setSearchText] = useState<string>('');

	const options = useMemo(() => {
		if (!categorizedChannels?.length) return [];
		return categorizedChannels?.flatMap((category) => [
			{
				id: (category as IChannel)?.channel_id || category.id,
				label: (category as IChannel)?.channel_label || category.category_name,
				title: (category as IChannel)?.channel_id ? 'channel' : 'category',
				type: (category as IChannel)?.channel_id ? EOptionOverridesType.Channel : EOptionOverridesType.Category
			}
		]);
	}, [categorizedChannels]);

	const [filteredOptions, setFilteredOptions] = useState(options);

	const onTextChange = (searchText: string) => {
		const filtered = options?.filter((option) => option?.label?.toLowerCase()?.includes(searchText?.toLowerCase()));
		setFilteredOptions(filtered);
		setSearchText(searchText);
	};

	return (
		<View style={{ flex: 1 }}>
			<View style={{ backgroundColor: themeValue.primary, width: '100%', height: '100%' }}>
				<View
					style={{
						paddingHorizontal: size.s_20,
						paddingVertical: size.s_10,
						borderTopColor: themeValue.border,
						borderBottomColor: themeValue.border,
						borderWidth: 1
					}}
				>
					<View
						style={{
							backgroundColor: themeValue.tertiary,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							borderRadius: size.s_6,
							paddingHorizontal: size.s_10,
							paddingVertical: size.s_4
						}}
					>
						<TextInput
							placeholderTextColor={themeValue.textDisabled}
							placeholder={'Search'}
							style={styles.input}
							value={searchText}
							onChangeText={onTextChange}
						/>
						<Icons.MagnifyingIcon width={20} height={20} color={themeValue.text} />
					</View>
				</View>
				<ScrollView>
					{filteredOptions?.length > 0
						? filteredOptions?.map((item) => (
								<CategoryChannelItem
									categoryLabel={item?.label}
									typePreviousIcon={item?.type}
									expandable={true}
									key={item?.id}
									stylesItem={styles.categoryItem}
									data={item}
									categoryChannelId={item?.id}
								/>
							))
						: null}
				</ScrollView>
			</View>
		</View>
	);
};

export default NotificationOverrides;
