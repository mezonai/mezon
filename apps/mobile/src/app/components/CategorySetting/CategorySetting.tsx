import { isEqual } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { categoriesActions, selectCategoryById, useAppDispatch } from '@mezon/store-mobile';
import { ApiUpdateCategoryDescRequest } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonInput from '../../componentUI/MezonInput';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import { style } from './styles';

type ScreenCategorySetting = typeof APP_SCREEN.MENU_CLAN.CATEGORY_SETTING;
export function CategorySetting({ navigation, route }: MenuClanScreenProps<ScreenCategorySetting>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['categorySetting']);
	const dispatch = useAppDispatch();
	const { categoryId } = route.params;
	const category = useSelector((state) => selectCategoryById(state, categoryId || ''));
	const [categorySettingValue, setCategorySettingValue] = useState<string>('');
	const [currentSettingValue, setCurrentSettingValue] = useState<string>('');

	const isNotChanged = useMemo(() => {
		if (!currentSettingValue) return true;
		return isEqual(categorySettingValue, currentSettingValue);
	}, [categorySettingValue, currentSettingValue]);

	const handleSaveCategorySetting = useCallback(async () => {
		const request: ApiUpdateCategoryDescRequest = {
			category_id: category?.category_id || '',
			category_name: currentSettingValue,
			ClanId: ''
		};
		dispatch(
			categoriesActions.updateCategory({
				clanId: category?.clan_id || '',
				request
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
	}, [category?.category_id, category?.clan_id, currentSettingValue, dispatch, navigation, t]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerRight: () => (
				<Pressable onPress={() => handleSaveCategorySetting()}>
					<Text style={[styles.saveChangeButton, !isNotChanged ? styles.changed : styles.notChange]}>{t('confirm.save')}</Text>
				</Pressable>
			)
		});
	}, [navigation, isNotChanged, styles, t, handleSaveCategorySetting]);

	useEffect(() => {
		if (category?.category_id) {
			setCategorySettingValue(category?.category_name);
			setCurrentSettingValue(category?.category_name);
		}
	}, [category]);

	const handleUpdateValue = (text: string) => {
		setCurrentSettingValue(text);
	};

	return (
		<ScrollView style={styles.container}>
			<MezonInput label={t('fields.categoryName.title')} value={currentSettingValue} onTextChange={handleUpdateValue} />
		</ScrollView>
	);
}
