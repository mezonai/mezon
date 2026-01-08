import { useCategorizedAllChannels } from '@mezon/core';
import { EOptionOverridesType } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { IChannel } from '@mezon/utils';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TextInput, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { CategoryChannelItem } from '../CategoryChannelItem';
import { style } from './NotificationOverrides.styles';

const NotificationOverrides = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const categorizedChannels = useCategorizedAllChannels();
	const [searchText, setSearchText] = useState<string>('');
	const { t } = useTranslation(['common']);

	const options = useMemo(() => {
		if (!categorizedChannels?.length) return [];
		return categorizedChannels?.flatMap((category) => [
			{
				id: (category as IChannel)?.channelId || category.id,
				label: (category as IChannel)?.channelLabel || category.categoryName,
				title: (category as IChannel)?.channelId ? 'channel' : 'category',
				type: (category as IChannel)?.channelId ? EOptionOverridesType.Channel : EOptionOverridesType.Category
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
		<View style={styles.container}>
			<View style={styles.contentContainer}>
				<View style={styles.searchContainer}>
					<View style={styles.searchInputWrapper}>
						<TextInput
							placeholderTextColor={themeValue.textDisabled}
							placeholder={t('searchPlaceHolder')}
							style={styles.input}
							value={searchText}
							onChangeText={onTextChange}
						/>
						<MezonIconCDN icon={IconCDN.magnifyingIcon} width={20} height={20} color={themeValue.text} />
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
