import { EOptionOverridesType } from '@mezon/mobile-components';
import { selectAllchannelCategorySetting } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { CategoryChannelItem } from '../CategoryChannelItem';
import { styles } from './styles';

export const CategoryChannel = React.memo(() => {
	const channelCategorySettings = useSelector(selectAllchannelCategorySetting);
	const sortedChannelCategorySettings = React.useMemo(() => {
		try {
			const settingOptions = [...channelCategorySettings];
			settingOptions?.sort((a, b) => {
				if (a.channelCategoryLabel && b.channelCategoryLabel) {
					if (a.channelCategoryLabel < b.channelCategoryLabel) {
						return -1;
					}
					if (a.channelCategoryLabel > b.channelCategoryLabel) {
						return 1;
					}
				}
				return 0;
			});
			return settingOptions;
		} catch (error) {
			return [];
		}
	}, [channelCategorySettings]);

	return (
		<View style={styles.container}>
			{sortedChannelCategorySettings?.length > 0
				? sortedChannelCategorySettings?.map((item) => (
						<CategoryChannelItem
							categoryLabel={item?.channelCategoryLabel}
							categorySubtext={item?.channelCategoryTitle}
							typePreviousIcon={
								item?.channelCategoryTitle === 'category' ? EOptionOverridesType.Category : ChannelType.CHANNEL_TYPE_CHANNEL
							}
							expandable={true}
							notificationStatus={item.notificationSettingType}
							data={item}
							key={item?.id}
							categoryChannelId={item?.id}
						/>
					))
				: null}
		</View>
	);
});
