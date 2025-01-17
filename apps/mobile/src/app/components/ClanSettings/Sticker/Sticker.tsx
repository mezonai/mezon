import { handleUploadEmoticonMobile, QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { createSticker, settingClanStickerActions, useAppDispatch } from '@mezon/store';
import { selectCurrentClanId, selectStickerByClanId } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { LIMIT_SIZE_UPLOAD_IMG } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ApiClanStickerAddRequest } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import { openCropper } from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { handleSelectImage, IFile } from '../../../componentUI';
import MezonButton, { EMezonButtonSize, EMezonButtonTheme } from '../../../componentUI/MezonButton2';
import { StickerSettingItem } from './StickerItem';
import { style } from './styles';

export function StickerSetting() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const timerRef = useRef<any>(null);
	const { sessionRef, clientRef } = useMezon();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const listSticker = useSelector(selectStickerByClanId(currentClanId));
	const availableLeft = useMemo(() => 50 - listSticker?.length, [listSticker]);
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['clanStickerSetting']);

	const loadSticker = useCallback(async () => {
		await dispatch(settingClanStickerActions.fetchStickerByUserId({}));
	}, [currentClanId]);

	const handleUploadImage = useCallback(async (file: IFile) => {
		if (Number(file.size) > Number(LIMIT_SIZE_UPLOAD_IMG / 2)) {
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

		const id = Snowflake.generate();
		const path = 'stickers/' + id + '.webp';
		const attachment = await handleUploadEmoticonMobile(client, session, path, file);

		return {
			id,
			url: attachment.url
		};
	}, []);

	const handleUploadSticker = useCallback(async () => {
		const file = await handleSelectImage();

		if (file) {
			timerRef.current = setTimeout(
				async () => {
					const croppedFile = await openCropper({
						path: file.uri,
						mediaType: 'photo',
						includeBase64: true,
						compressImageQuality: QUALITY_IMAGE_UPLOAD,
						width: 320,
						height: 320
					});

					// TODO: check category
					const category = 'Among Us';

					if (Number(croppedFile.size) > Number(LIMIT_SIZE_UPLOAD_IMG / 2)) {
						Toast.show({
							type: 'error',
							text1: t('toast.errorSizeLimit')
						});
						return;
					}

					const { id, url } = await handleUploadImage({
						fileData: croppedFile?.data,
						name: file.name,
						uri: croppedFile.path,
						size: croppedFile.size,
						type: croppedFile.mime
					});

					const request: ApiClanStickerAddRequest = {
						id: id,
						category: category,
						clan_id: currentClanId,
						shortname: 'sticker_00',
						source: url
					};

					dispatch(createSticker({ request: request, clanId: currentClanId }));
				},
				Platform.OS === 'ios' ? 500 : 0
			);
		}
	}, []);

	useEffect(() => {
		loadSticker();
	}, []);

	return (
		<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
			<View style={styles.container}>
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ backgroundColor: themeValue.primary }}>
					<MezonButton
						title={t('btn.upload')}
						type={EMezonButtonTheme.SUCCESS}
						size={EMezonButtonSize.MD}
						rounded={true}
						containerStyle={styles.btn}
						onPress={handleUploadSticker}
						titleStyle={styles.btnTitle}
					/>

					<Text style={styles.text}>{t('content.description')}</Text>
					<Text style={[styles.text, styles.textTitle]}>{t('content.requirements')}</Text>
					<Text style={styles.text}>{t('content.reqType')}</Text>
					<Text style={styles.text}>{t('content.reqDim')}</Text>
					<Text style={styles.text}>{t('content.reqSize')}</Text>

					<Text style={[styles.text, styles.textTitle]}>{t('content.available', { left: availableLeft })}</Text>

					{listSticker?.map((item, index) => <StickerSettingItem data={item} clanID={currentClanId} key={'sticker_' + item.id} />)}
				</ScrollView>
			</View>
		</TouchableWithoutFeedback>
	);
}
