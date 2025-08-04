import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { categoriesActions, selectCategoryExpandStateByCategoryId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { ICategoryChannel } from '@mezon/utils';
import React, { memo, useCallback } from 'react';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import CategoryMenu from '../../CategoryMenu';
import { style } from './styles';

interface IChannelListSectionProps {
	data: ICategoryChannel;
}

const ChannelListSection = memo(({ data }: IChannelListSectionProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const categoryExpandState = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, data?.category_id));

	const toggleCollapse = useCallback(
		(category: ICategoryChannel) => {
			const payload = {
				clanId: category.clan_id || '',
				categoryId: category.id,
				expandState: !categoryExpandState
			};
			dispatch(categoriesActions.setCategoryExpandState(payload));
		},
		[dispatch, categoryExpandState]
	);

	const onLongPressHeader = useCallback(() => {
		const dataBottomSheet = {
			heightFitContent: true,
			children: <CategoryMenu category={data} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data: dataBottomSheet });
	}, [data]);

	if (!data?.category_name?.trim()) {
		return;
	}

	return (
		<View style={styles.channelListSection}>
			<TouchableOpacity
				activeOpacity={0.8}
				onPress={() => toggleCollapse(data)}
				onLongPress={onLongPressHeader}
				style={styles.channelListHeader}
			>
				<View style={styles.channelListHeaderItem}>
					<MezonIconCDN
						icon={IconCDN.chevronDownSmallIcon}
						height={size.s_18}
						width={size.s_18}
						color={themeValue.text}
						customStyle={[!categoryExpandState && { transform: [{ rotate: '-90deg' }] }]}
					/>
					<Text style={styles.channelListHeaderItemTitle}>{data?.category_name}</Text>
				</View>
			</TouchableOpacity>
		</View>
	);
});
export default ChannelListSection;
