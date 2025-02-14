import { size } from '@mezon/mobile-ui';
import { selectAllchannelCategorySetting } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { CategoryChannelItem } from '../CategoryChannelItem';

export const CategoryChannel = React.memo(() => {
	const channelCategorySettings = useSelector(selectAllchannelCategorySetting);
	const sortedChannelCategorySettings = React.useMemo(() => {
		const settingOptions = [...channelCategorySettings];
		settingOptions?.sort((a, b) => {
			if (a.channel_category_label && b.channel_category_label) {
				if (a.channel_category_label < b.channel_category_label) {
					return -1;
				}
				if (a.channel_category_label > b.channel_category_label) {
					return 1;
				}
			}
			return 0;
		});
		return settingOptions;
	}, [channelCategorySettings]);

	return (
		<View style={{ borderRadius: size.s_14, overflow: 'hidden' }}>
			{sortedChannelCategorySettings?.length > 0
				? sortedChannelCategorySettings?.map((item) => (
						<CategoryChannelItem
							categoryLabel={item?.channel_category_label}
							categorySubtext={item?.channel_category_title}
							typePreviousIcon={ChannelType.CHANNEL_TYPE_CHANNEL}
							expandable={true}
							notificationStatus={item.notification_setting_type}
							data={item}
							key={item?.id}
							categoryChannelId={item?.id}
						/>
					))
				: null}
		</View>
	);
});
