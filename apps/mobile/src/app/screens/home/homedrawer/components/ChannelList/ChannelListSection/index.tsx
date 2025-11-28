import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	FAVORITE_CATEGORY_ID,
	PUBLIC_CHANNELS_NAME,
	categoriesActions,
	selectCategoryExpandStateByCategoryId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type { ICategoryChannel } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
	const { t } = useTranslation('channelList');
	const dispatch = useAppDispatch();
	const categoryExpandState = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, data?.category_id));

	const categoryName = useMemo(() => {
		return data?.id === FAVORITE_CATEGORY_ID
			? t('favoriteChannel')
			: data?.category_name === PUBLIC_CHANNELS_NAME
				? t('publicChannels')
				: data?.category_name || '';
	}, [data?.category_name, data?.id, t]);

	const toggleCollapse = useCallback(
		(category: ICategoryChannel) => {
			dispatch(
				categoriesActions.setCategoryExpandState({
					clanId: category.clan_id || '',
					categoryId: category.id,
					expandState: !categoryExpandState
				})
			);
		},
		[categoryExpandState]
	);

	const onLongPressHeader = useCallback(() => {
		if (data?.category_id === FAVORITE_CATEGORY_ID) {
			return;
		}

		const dataBottomSheet = {
			heightFitContent: true,
			children: <CategoryMenu category={data} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data: dataBottomSheet });
	}, [data]);

	if (!categoryName.trim()) {
		return null;
	}

	return (
		<View style={styles.channelListSection}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.secondary, themeValue?.primaryGradiant || themeValue.secondary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
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
					<Text style={styles.channelListHeaderItemTitle} numberOfLines={1}>
						{categoryName}
					</Text>
				</View>
			</TouchableOpacity>
		</View>
	);
});
export default ChannelListSection;
