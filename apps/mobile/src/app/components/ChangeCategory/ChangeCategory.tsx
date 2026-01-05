import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme, verticalScale } from '@mezon/mobile-ui';
import type { CategoriesEntity } from '@mezon/store-mobile';
import { appActions, channelsActions, getStore, selectAllCategories, selectAppChannelById, useAppDispatch } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import type { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonMenu from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import type { APP_SCREEN, MenuChannelScreenProps } from '../../navigation/ScreenTypes';
import { style } from './ChangeCategory.styles';

type ChangeCategory = typeof APP_SCREEN.MENU_CHANNEL.CHANGE_CATEGORY;
export const ChangeCategory = ({ navigation, route }: MenuChannelScreenProps<ChangeCategory>) => {
	const { channel } = route.params;
	const { themeValue } = useTheme();
	const { t } = useTranslation(['channelSetting']);
	const listCategory = useSelector(selectAllCategories);
	const dispatch = useAppDispatch();
	const styles = style(themeValue);

	const handleMoveChannelToNewCategory = async (category: CategoriesEntity) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		let appUrl = '';
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			if (channel?.type === ChannelType.CHANNEL_TYPE_APP) {
				const store = getStore();
				const appChannel = selectAppChannelById(store.getState(), channel.channelId as string);
				if (appChannel) {
					appUrl = appChannel?.app_url;
				}
			}
			const updateChannel = {
				clanId: channel?.clanId,
				categoryId: category.id,
				channelId: channel?.channelId ?? '',
				channelLabel: channel?.channelLabel,
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
			await dispatch(channelsActions.changeCategoryOfChannel(updateChannel));
			dispatch(
				channelsActions.setCurrentChannelId({
					channelId: channel.channelId,
					clanId: channel.clanId
				})
			);
		} catch (error) {
			console.error('Error moving channel to new category:', error);
			Toast.show({
				type: 'error',
				text1: t('changeCategory.error')
			});
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const listOtherCategories = useMemo(() => {
		return listCategory.filter((category) => category.id !== channel.categoryId);
	}, [listCategory]);

	const handleShowComfirmMoveChannel = useCallback(
		(category: CategoriesEntity) => {
			const data = {
				children: (
					<MezonConfirm
						onConfirm={() => handleMoveChannelToNewCategory(category)}
						title={t('changeCategory.title')}
						confirmText={t('changeCategory.confirm')}
						children={
							<Text style={styles.confirmText}>
								{t('changeCategory.confirmFirstContent')}
								<Text style={styles.boldText}> {channel?.channelLabel} </Text>
								{t('changeCategory.confirmLastContent')}
								<Text style={styles.boldText}> {category?.categoryName}</Text>?
							</Text>
						}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[channel?.channelLabel, t, styles]
	);

	const CategoryList = useMemo(
		() =>
			listOtherCategories.map((category) => {
				return {
					onPress: () => handleShowComfirmMoveChannel(category),
					title: category.categoryName ?? ''
				};
			}) satisfies IMezonMenuItemProps[],
		[]
	);

	const menu: IMezonMenuSectionProps[] = [
		{
			title: t('changeCategory.label', { currentChannel: channel?.categoryName }),
			items: CategoryList
		}
	];

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: () => (
				<View>
					<Text style={styles.headerTitle}>
						{t('changeCategory.title')}
					</Text>
				</View>
			),
			headerLeft: () => {
				return (
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<View style={styles.headerLeftContainer}>
							<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={themeValue.white} height={size.s_22} width={size.s_22} />
						</View>
					</TouchableOpacity>
				);
			}
		});
	}, [navigation, t, themeValue.white, styles]);

	return (
		<View style={styles.container}>
			<MezonMenu menu={menu} />
		</View>
	);
};
