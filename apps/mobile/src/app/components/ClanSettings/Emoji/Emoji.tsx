import { ActionEmitEvent, QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { createEmojiSetting, selectCurrentClanId, selectEmojiByClanId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { LIMIT_SIZE_UPLOAD_IMG } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import { Buffer as BufferMobile } from 'buffer';
import { ApiClanEmojiCreateRequest } from 'mezon-js/api.gen';
import { useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, Platform, Pressable, Text, View } from 'react-native';
import { Image as ImageCompressor } from 'react-native-compressor';
import RNFS from 'react-native-fs';
import { Image, openCropper, openPicker } from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { IFile } from '../../../componentUI/MezonImagePicker';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { EmojiList } from './EmojiList';
import { EmojiPreview } from './EmojiPreview';
import { style } from './styles';

export const { width, height } = Dimensions.get('window');
type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.EMOJI_SETTING;
export function ClanEmojiSetting({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const { sessionRef, clientRef } = useMezon();
	const { t } = useTranslation(['clanEmojiSetting']);
	const emojiList = useAppSelector((state) => selectEmojiByClanId(state, currentClanId || ''));

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerBackTitleVisible: false
		});
	}, [navigation]);

	const handleUploadImage = useCallback(
		async (file: IFile) => {
			if (Number(file.size) > Number(LIMIT_SIZE_UPLOAD_IMG / 4)) {
				Toast.show({
					type: 'error',
					text1: t('toast.errorSizeLimit')
				});
				return;
			}

			const session = sessionRef.current;
			const client = clientRef.current;
			if (!client || !session) {
				throw new Error('Client or file is not initialized');
			}

			const arrayBuffer = BufferMobile.from(file?.fileData, 'base64');

			const id = Snowflake.generate();
			const path = `emojis/${id}.webp`;
			const attachment = await handleUploadEmoticon(client, session, path, file as unknown as File, true, arrayBuffer);

			return {
				id,
				url: attachment.url
			};
		},
		[clientRef, sessionRef, t]
	);

	const handleAddEmoji = async () => {
		try {
			const selectedFile = await openPicker({
				mediaType: 'photo',
				includeBase64: true,
				cropping: false
			});

			if (Number(selectedFile.size) > Number(LIMIT_SIZE_UPLOAD_IMG / 4)) {
				Toast.show({
					type: 'error',
					text1: t('toast.errorSizeLimit')
				});
				return;
			}

			const isGif = selectedFile.mime === 'image/gif';

			let croppedFile;
			if (isGif) {
				// For GIFs, don't crop to preserve animation
				croppedFile = selectedFile;
			} else {
				// For other images, apply cropping and compression
				croppedFile = await openCropper({
					path: selectedFile.path,
					mediaType: 'photo',
					includeBase64: true,
					cropping: true,
					compressImageQuality: QUALITY_IMAGE_UPLOAD,
					...(typeof width === 'number' && { width, height: width })
				});
			}

			const data = {
				children: <EmojiPreview image={croppedFile} onConfirm={handleUploadConfirm} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		} catch (e) {
			if (e?.code !== 'E_PICKER_CANCELLED') {
				Toast.show({
					type: 'error',
					text1: 'Error uploading emoji'
				});
			}
		}
	};

	const handleUploadConfirm = async (croppedFile: Image, emojiName: string, isForSale: boolean) => {
		try {
			const shortname = `:${emojiName}:`;
			const { id, url } = await handleUploadImage({
				fileData: croppedFile?.data,
				name: croppedFile?.filename,
				uri: croppedFile?.path,
				size: croppedFile?.size,
				type: croppedFile?.mime
			});
			const request: ApiClanEmojiCreateRequest = {
				id,
				category: 'Custom',
				clan_id: currentClanId,
				shortname,
				source: url,
				is_for_sale: isForSale
			};

			if (isForSale) {
				const pathCompressed = await ImageCompressor.compress(croppedFile.path, {
					compressionMethod: 'auto',
					maxWidth: 35,
					maxHeight: 35,
					quality: 0.1
				});

				const fileData = await RNFS.readFile(pathCompressed?.replace?.('%20', ' ') || '', 'base64');
				const { id } = await handleUploadImage({
					fileData,
					name: croppedFile?.filename,
					uri: croppedFile?.path,
					size: croppedFile?.size,
					type: croppedFile?.mime
				});
				request.id = id;
			}

			dispatch(createEmojiSetting({ request, clanId: currentClanId }));
		} catch (e) {
			Toast.show({
				type: 'error',
				text1: 'Error uploading emoji'
			});
		}
	};

	const ListHeaderComponent = () => {
		return (
			<View style={styles.header}>
				<Pressable style={styles.addEmojiButton} onPress={handleAddEmoji}>
					<Text style={styles.buttonText}>{t('button.upload')}</Text>
				</Pressable>
				<Text style={styles.title}>{t('description.descriptions')}</Text>
				<Text style={styles.lightTitle}>{t('description.requirements')}</Text>
				<Text style={styles.requireTitle}>{t('description.requireList')}</Text>
			</View>
		);
	};
	return (
		<View style={styles.container}>
			<EmojiList emojiList={emojiList?.length > 0 ? emojiList : []} ListHeaderComponent={ListHeaderComponent} />
		</View>
	);
}
