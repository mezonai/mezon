import { handleUploadEmoticonMobile, QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { appActions, createEmojiSetting, selectCurrentClanId, selectEmojiByClanId, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { LIMIT_SIZE_UPLOAD_IMG, MAX_FILE_NAME_EMOJI } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ApiClanEmojiCreateRequest, ApiMessageAttachment } from 'mezon-js/api.gen';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { openCropper } from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { EmojiList } from './EmojiList';
import { style } from './styles';

export interface IFile {
	uri: string;
	name: string;
	type: string;
	size: number;
	fileData: any;
}

export const { width, height } = Dimensions.get('window');
type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.EMOJI_SETTING;
export function ClanEmojiSetting({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const { sessionRef, clientRef } = useMezon();
	const { t } = useTranslation(['clanEmojiSetting']);
	const emojiList = useSelector(selectEmojiByClanId(currentClanId || ''));

	const timerRef = useRef<any>(null);
	const buttonRef = useRef<any>(null);

	useEffect(() => {
		navigation.setOptions({
			headerBackTitleVisible: false
		});
	}, [navigation]);

	useEffect(() => {
		return () => {
			timerRef?.current && clearTimeout(timerRef.current);
		};
	}, []);

	const handleSelectImage = async () => {
		buttonRef.current.disabled = true;
		const response = await launchImageLibrary({
			mediaType: 'photo',
			includeBase64: true,
			quality: 1
		});

		if (response.didCancel) {
			console.warn('User cancelled camera');
		} else if (response.errorCode) {
			console.error('Camera Error: ', response.errorMessage);
		} else {
			const file = response?.assets[0];
			return file;
		}
		buttonRef.current.disabled = false;
	};

	const handleAddEmoji = async () => {
		const file = await handleSelectImage();
		try {
			if (file) {
				timerRef.current = setTimeout(
					async () => {
						const croppedFile = await openCropper({
							path: file.uri,
							mediaType: 'photo',
							includeBase64: true,
							compressImageQuality: QUALITY_IMAGE_UPLOAD,
							...(typeof width === 'number' && { width: width, height: width })
						});
						const uploadImagePayload = {
							name: file.fileName,
							size: croppedFile.size,
							type: croppedFile.mime,
							uri: croppedFile.path,
							fileData: croppedFile.data
						} as IFile;

						if (Number(croppedFile.size) > Number(LIMIT_SIZE_UPLOAD_IMG / 4)) {
							Toast.show({
								type: 'error',
								text1: t('toast.errorSizeLimit')
							});
							return;
						}

						dispatch(appActions.setLoadingMainMobile(true));

						const session = sessionRef.current;
						const client = clientRef.current;
						const fileNameParts = file.fileName?.split('.');
						const shortname = fileNameParts.slice(0, -1).join('.').slice(0, MAX_FILE_NAME_EMOJI);
						const id = Snowflake.generate();
						const path = 'emojis/' + id + '.webp';

						handleUploadEmoticonMobile(client, session, path, uploadImagePayload)
							.then(async (attachment: ApiMessageAttachment) => {
								const request: ApiClanEmojiCreateRequest = {
									id: id,
									category: 'Custom',
									clan_id: currentClanId,
									shortname: shortname,
									source: attachment.url
								};
								dispatch(createEmojiSetting({ request: request, clanId: currentClanId }));
							})
							.finally(() => {
								dispatch(appActions.setLoadingMainMobile(false));
							});
					},
					Platform.OS === 'ios' ? 500 : 0
				);
			}
		} catch (e) {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<Pressable ref={buttonRef} style={styles.addEmojiButton} onPress={handleAddEmoji}>
					<Text style={styles.buttonText}>{t('button.upload')}</Text>
				</Pressable>
				<Text style={styles.title}>{t('description.descriptions')}</Text>
				<Text style={styles.lightTitle}>{t('description.requirements')}</Text>
				<Text style={styles.requireTitle}>{t('description.requireList')}</Text>
				<EmojiList emojiList={emojiList} />
			</ScrollView>
		</View>
	);
}
