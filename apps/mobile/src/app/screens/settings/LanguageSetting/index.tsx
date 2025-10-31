import { useTheme } from '@mezon/mobile-ui';
import { appActions, selectCurrentLanguage, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { styles } from './styles';

export const LanguageSetting = () => {
	const currentLanguage = useAppSelector(selectCurrentLanguage);
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const themeStyles = styles(themeValue);
	const { i18n } = useTranslation();

	const languageList = useMemo(() => {
		return [
			{
				title: 'English',
				value: 'en'
			},
			{
				title: 'Tiếng Việt',
				value: 'vi'
			}
		];
	}, []);

	const changeLanguage = async (lang: string) => {
		try {
			dispatch(appActions.setLanguage(lang));
			await i18n.changeLanguage(lang);
		} catch (error: any) {
			console.error('Error changing language: ', error);
		}
	};

	return (
		<View style={themeStyles.languageSettingContainer}>
			<FlatList
				data={languageList}
				keyExtractor={(item) => item.value}
				ItemSeparatorComponent={() => <View style={themeStyles.itemSeparator} />}
				renderItem={({ item }) => (
					<Pressable onPress={() => changeLanguage(item.value)} style={[themeStyles.languageItem]}>
						<Text style={themeStyles.optionText}>{item.title}</Text>
						{currentLanguage === item.value ? <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={themeValue.bgViolet} /> : null}
					</Pressable>
				)}
			/>
		</View>
	);
};
