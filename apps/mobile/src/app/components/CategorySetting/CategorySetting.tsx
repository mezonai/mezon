import { useCategorizedAllChannels } from '@mezon/core';
import {
	ActionEmitEvent,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	getUpdateOrAddClanChannelCache,
	isEqual,
	load,
	save
} from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { categoriesActions, channelsActions, getStoreAsync, selectCategoryById, useAppDispatch } from '@mezon/store-mobile';
import { ICategoryChannel, IChannel } from '@mezon/utils';
import { ApiUpdateCategoryDescRequest } from 'mezon-js/api.gen';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Pressable, ScrollView, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonInput from '../../componentUI/MezonInput';
import { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import { style } from './styles';

type ScreenCategorySetting = typeof APP_SCREEN.MENU_CLAN.CATEGORY_SETTING;
export function CategorySetting({ navigation, route }: MenuClanScreenProps<ScreenCategorySetting>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['categorySetting']);
	const dispatch = useAppDispatch();
	const categorizedChannels = useCategorizedAllChannels();
	const { categoryId } = route.params;
	const category = useSelector((state) => selectCategoryById(state, categoryId || ''));
	const [categorySettingValue, setCategorySettingValue] = useState<string>('');
	const [currentSettingValue, setCurrentSettingValue] = useState<string>('');

	const isNotChanged = useMemo(() => {
		if (!currentSettingValue) return true;
		return isEqual(categorySettingValue, currentSettingValue);
	}, [categorySettingValue, currentSettingValue]);

	useEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerRight: () => (
				<Pressable onPress={() => handleSaveCategorySetting()}>
					<Text style={[styles.saveChangeButton, !isNotChanged ? styles.changed : styles.notChange]}>{t('confirm.save')}</Text>
				</Pressable>
			)
		});
	}, [navigation, isNotChanged, styles.saveChangeButton, styles.changed, styles.notChange, t]);

	useEffect(() => {
		if (category?.category_id) {
			setCategorySettingValue(category?.category_name);
			setCurrentSettingValue(category?.category_name);
		}
	}, [category]);

	const permissionMenu = useMemo(
		() =>
			[
				{
					title: t('fields.categoryPermission.permission'),
					expandable: true,
					icon: <MezonIconCDN icon={IconCDN.shieldUserIcon} color={themeValue.text} />
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);

	const deleteMenu = useMemo(
		() =>
			[
				{
					title: t('fields.categoryDelete.delete'),
					textStyle: { color: baseColor.redStrong },
					onPress: () => handlePressDeleteCategory()
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);

	const menu = useMemo(
		() =>
			[
				{
					items: permissionMenu,
					bottomDescription: t('fields.categoryPermission.description')
				},
				{
					items: deleteMenu
				}
			] satisfies IMezonMenuSectionProps[],
		[]
	);

	const handleUpdateValue = (text: string) => {
		setCurrentSettingValue(text);
	};

	const handleSaveCategorySetting = async () => {
		const request: ApiUpdateCategoryDescRequest = {
			category_id: category?.category_id || '',
			category_name: currentSettingValue,
			ClanId: ''
		};
		dispatch(
			categoriesActions.updateCategory({
				clanId: category?.clan_id || '',
				request: request
			})
		);

		navigation?.goBack();
		Toast.show({
			type: 'success',
			props: {
				text2: t('toast.updated'),
				leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
			}
		});
	};

	const handleFocusDefaultChannel = async () => {
		const targetIndex = categorizedChannels.findIndex((obj) => obj.category_id === category.id);
		let channelNavId = '';
		if (targetIndex !== -1) {
			if (targetIndex === 0) {
				const nextCategory = categorizedChannels[targetIndex + 1] as ICategoryChannel;
				channelNavId = (nextCategory?.channels?.[0] as IChannel)?.id;
			} else {
				const prevCategory = categorizedChannels[targetIndex - 1] as ICategoryChannel;
				channelNavId = (prevCategory?.channels?.[0] as IChannel)?.id;
			}
		}

		if (channelNavId && category.clan_id) {
			const store = await getStoreAsync();
			const dataSave = getUpdateOrAddClanChannelCache(category.clan_id, channelNavId);
			await Promise.all([
				store.dispatch(channelsActions.joinChannel({ clanId: category.clan_id ?? '', channelId: channelNavId, noFetchMembers: false })),
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave)
			]);

			const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];
			if (!channelsCache?.includes(channelNavId)) {
				save(STORAGE_CHANNEL_CURRENT_CACHE, [...channelsCache, channelNavId]);
			}
			return;
		}
	};

	const handleDeleteCategory = async () => {
		navigation.navigate(APP_SCREEN.HOME);

		await dispatch(
			categoriesActions.deleteCategory({
				clanId: category.clan_id as string,
				categoryId: category.id as string,
				categoryLabel: category.category_name as string
			})
		);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		handleFocusDefaultChannel();
	};

	const handlePressDeleteCategory = () => {
		const data = {
			children: (
				<MezonConfirm
					onConfirm={handleDeleteCategory}
					title={t('confirm.delete.title')}
					confirmText={t('confirm.delete.confirmText')}
					content={t('confirm.delete.content', {
						categoryName: category?.category_name
					})}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	return (
		<ScrollView style={styles.container}>
			<MezonInput label={t('fields.categoryName.title')} value={currentSettingValue} onTextChange={handleUpdateValue} />

			{/*<MezonMenu menu={menu} />*/}
		</ScrollView>
	);
}
