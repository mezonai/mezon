import { useTheme } from '@mezon/mobile-ui';
import { selectAudioByClanId, selectCurrentClanId, useAppSelector } from '@mezon/store-mobile';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform, Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { SoundList } from './SoundList';
import { style } from './styles';

export const { width, height } = Dimensions.get('window');
type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.SOUND_STICKER;
export function SoundBoardSetting({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const { t } = useTranslation(['clanSoundSetting']);
	const soundList = useAppSelector((state) => selectAudioByClanId(state, currentClanId));

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerBackTitleVisible: false
		});
	}, [navigation]);

	const handleAddEmoji = async () => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.CREATE_SOUND);
	};
	const ListHeaderComponent = () => {
		return (
			<View>
				<Pressable style={styles.addEmojiButton} onPress={handleAddEmoji}>
					<Text style={styles.buttonText}>{t('button.upload')}</Text>
				</Pressable>
				<Text style={styles.lightTitle}>{t('content.requirements')}</Text>
				<Text style={styles.title}>{t('content.description')}</Text>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<SoundList soundList={soundList} ListHeaderComponent={ListHeaderComponent} />
		</View>
	);
}
