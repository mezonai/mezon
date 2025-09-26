import { size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { CategoriesEntity, channelsActions, getStore, selectAllCategories, selectAppChannelById, useAppDispatch } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import { useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuChannelScreenProps } from '../../navigation/ScreenTypes';

type ChangeCategory = typeof APP_SCREEN.MENU_CHANNEL.CHANGE_CATEGORY;
export const ChangeCategory = ({ navigation, route }: MenuChannelScreenProps<ChangeCategory>) => {
	const { channel } = route.params;
	const { themeValue } = useTheme();
	const { t } = useTranslation(['channelSetting']);
	const listCategory = useSelector(selectAllCategories);
	const dispatch = useAppDispatch();

	const handleMoveChannelToNewCategory = async (category: CategoriesEntity) => {
		let appUrl = '';
		if (channel?.type === ChannelType.CHANNEL_TYPE_APP) {
			const store = getStore();
			const appChannel = selectAppChannelById(store.getState(), channel.channel_id as string);
			if (appChannel) {
				appUrl = appChannel?.app_url;
			}
		}
		const updateChannel = {
			clan_id: channel?.clan_id,
			category_id: category.id,
			channel_id: channel?.channel_id ?? '',
			channel_label: channel?.channel_label,
			app_url: appUrl,
			app_id: channel?.app_id || '',
			age_restricted: channel?.age_restricted,
			e2ee: channel?.e2ee,
			topic: channel?.topic,
			parent_id: channel?.parent_id,
			channel_private: channel?.channel_private
		};
		await dispatch(channelsActions.updateChannel(updateChannel)).then(() => {
			navigation.goBack();
		});
		dispatch(
			channelsActions.setCurrentChannelId({
				channelId: channel.channel_id,
				clanId: channel.clan_id
			})
		);
	};

	const listOtherCategories = useMemo(() => {
		return listCategory.filter((category) => category.id !== channel.category_id);
	}, [listCategory]);

	const CategoryList = useMemo(
		() =>
			listOtherCategories.map((category) => {
				return {
					onPress: () => handleMoveChannelToNewCategory(category),
					title: category.category_name ?? ''
				};
			}) satisfies IMezonMenuItemProps[],
		[]
	);

	const menu: IMezonMenuSectionProps[] = [
		{
			title: t('changeCategory.label', { currentChannel: channel?.category_name }),
			items: CategoryList
		}
	];

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: () => (
				<View>
					<Text
						style={{
							fontSize: verticalScale(18),
							marginLeft: 0,
							marginRight: 0,
							fontWeight: 'bold',
							color: themeValue.white
						}}
					>
						{t('changeCategory.title')}
					</Text>
				</View>
			),
			headerLeft: () => {
				return (
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<View style={{ marginLeft: size.s_16 }}>
							<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={themeValue.white} height={size.s_22} width={size.s_22} />
						</View>
					</TouchableOpacity>
				);
			}
		});
	}, [navigation, t, themeValue.white]);

	return (
		<View style={{ flex: 1, backgroundColor: themeValue.primary, paddingHorizontal: size.s_12 }}>
			<MezonMenu menu={menu} />
		</View>
	);
};
