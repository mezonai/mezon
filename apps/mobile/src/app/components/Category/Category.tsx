import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { categoriesActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { ApiCreateCategoryDescRequest } from 'mezon-js/api.gen';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonInput from '../../componentUI/MezonInput';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import { validInput } from '../../utils/validate';
import { MAX_NAME_LENGTH } from '../ClanSettings/Emoji/EmojiPreview';
import { style } from './styles';

type CreateCategoryScreen = typeof APP_SCREEN.MENU_CLAN.CREATE_CATEGORY;
export function CategoryCreator({ navigation }: MenuClanScreenProps<CreateCategoryScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [categoryName, setCategoryName] = useState<string>('');
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const { t } = useTranslation(['categoryCreator']);
	const handleCreateCategory = useCallback(async () => {
		if (!validInput(categoryName)) return;

		const body: ApiCreateCategoryDescRequest = {
			clan_id: currentClanId?.toString(),
			category_name: categoryName?.trim()
		};
		await dispatch(categoriesActions.createNewCategory(body));
		setCategoryName('');

		navigation.navigate(APP_SCREEN.HOME);
	}, [categoryName, currentClanId, dispatch, navigation]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerRight: () => (
				<Pressable onPress={handleCreateCategory}>
					<Text
						style={{
							color: baseColor.blurple,
							fontWeight: 'bold',
							paddingHorizontal: 20,
							opacity: categoryName?.trim()?.length > 0 ? 1 : 0.5,
							fontSize: size.medium
						}}
					>
						{t('actions.create')}
					</Text>
				</Pressable>
			),

			headerLeft: () => (
				<Pressable style={{ padding: 20 }} onPress={() => navigation.goBack()}>
					<MezonIconCDN icon={IconCDN.closeSmallBold} height={size.s_20} width={size.s_20} color={themeValue.text} />
				</Pressable>
			)
		});
	}, [navigation, categoryName, t, themeValue.text, handleCreateCategory]);

	return (
		<View style={styles.container}>
			<MezonInput
				value={categoryName}
				onTextChange={setCategoryName}
				placeHolder={t('fields.cateName.placeholder')}
				errorMessage={t('fields.cateName.errorMessage')}
				label={t('fields.cateName.title')}
				maxCharacter={MAX_NAME_LENGTH}
			/>
		</View>
	);
}
