import { ActionEmitEvent, QUALITY_IMAGE_UPLOAD } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { createSticker, selectCurrentClanId, selectStickersByClanId, useAppDispatch } from '@mezon/store-mobile';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { LIMIT_SIZE_UPLOAD_IMG, MAX_CLAN_ITEM_SLOTS } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import { Buffer as BufferMobile } from 'buffer';
import type { ApiClanStickerAddRequest } from 'mezon-js/api.gen';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, Text, View } from 'react-native';
import { openCropper, openPicker } from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import type { IFile } from '../../../componentUI/MezonImagePicker';
import { getEmojiAndStickerId } from '../../../utils/helpers';
import { EmojiPreview } from '../Emoji/EmojiPreview';
import { StickerList } from './StickerList';
import { style } from './styles';

export function StickerSetting({ navigation }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { sessionRef, clientRef } = useMezon();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const listSticker = useSelector(selectStickersByClanId(currentClanId));
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['clanStickerSetting', 'common']);

	const [watermarkState, setWatermarkState] = useState<{
		isProcessing: boolean;
		html: string;
		resolve?: (value: string) => void;
		reject?: (reason?: any) => void;
	}>({
		isProcessing: false,
		html: ''
	});

	const createBlurredWatermarkedImageFile = (base64Data: string, watermarkText = 'SOLD') => {
		return new Promise((resolve, reject) => {
			const dataUri = `data:image/png;base64,${base64Data}`;

			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
				</head>
				<body>
					<canvas id="canvas"></canvas>
					<script>
						const canvas = document.getElementById('canvas');
						const ctx = canvas.getContext('2d');
						const img = new Image();
						
						img.onload = function() {
							canvas.width = img.width;
							canvas.height = img.height;
							ctx.filter = 'blur(2px)';
							ctx.drawImage(img, 0, 0);
							
							ctx.filter = 'none';
							const fontSize = Math.floor(canvas.width / 2);
							ctx.font = 'bold ' + fontSize + 'px sans-serif';
							ctx.fillStyle = 'rgba(128, 128, 128, 0.75)';
							ctx.textAlign = 'center';
							ctx.textBaseline = 'middle';
							
							ctx.save();
							ctx.translate(canvas.width / 2, canvas.height / 2);
							ctx.rotate((45 * Math.PI) / 180);
							ctx.fillText('${watermarkText}', 0, 0);
							ctx.restore();
							
							const dataURL = canvas.toDataURL('image/png', 1);
							window.ReactNativeWebView.postMessage(dataURL);
						};
						
						img.onerror = () => window.ReactNativeWebView.postMessage('ERROR: Image load failed');
						img.src = '${dataUri}';
					</script>
				</body>
				</html>
			`;

			setWatermarkState({
				isProcessing: true,
				html,
				resolve,
				reject
			});
		});
	};

	const handleWebViewMessage = useCallback(
		(event: any) => {
			const result = event?.nativeEvent?.data;

			if (result?.startsWith('ERROR')) {
				watermarkState?.reject?.(new Error('Cannot process image'));
			} else if (result?.startsWith('data:image')) {
				const base64Data = result?.split(',')?.[1];
				watermarkState?.resolve?.(base64Data);
			}

			setWatermarkState({
				isProcessing: false,
				html: ''
			});
		},
		[watermarkState]
	);

	const handleUploadImage = useCallback(async (file: IFile) => {
		if (Number(file?.size) > Number(LIMIT_SIZE_UPLOAD_IMG / 2)) {
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
		const path = `stickers/${id}.webp`;
		const attachment = await handleUploadEmoticon(client, session, path, file as unknown as File, true, arrayBuffer);
		const stickerId = getEmojiAndStickerId(attachment?.url);

		return {
			id: stickerId,
			url: attachment?.url
		};
	}, []);

	const handleUploadSticker = async () => {
		if (listSticker?.length > MAX_CLAN_ITEM_SLOTS) {
			Toast.show({
				type: 'error',
				text1: t('common:uploadLimit.sticker')
			});
			return;
		}
		try {
			const selectedFile = await openPicker({
				mediaType: 'photo',
				includeBase64: true,
				cropping: false
			});

			if (Number(selectedFile?.size) > Number(LIMIT_SIZE_UPLOAD_IMG / 2)) {
				Toast.show({
					type: 'error',
					text1: t('toast.errorSizeLimit')
				});
				return;
			}

			const isGif = selectedFile?.mime === 'image/gif';

			let croppedFile;
			if (isGif) {
				croppedFile = selectedFile;
			} else {
				croppedFile = await openCropper({
					path: selectedFile?.path || '',
					mediaType: 'photo',
					includeBase64: true,
					cropping: true,
					compressImageQuality: QUALITY_IMAGE_UPLOAD,
					width: 320,
					height: 320
				});
			}

			const data = {
				children: <EmojiPreview isSticker={true} image={croppedFile} onConfirm={handleUploadConfirm} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		} catch (e) {
			if (e?.code !== 'E_PICKER_CANCELLED') {
				Toast.show({
					type: 'error',
					text1: 'Error uploading sticker'
				});
			}
		}
	};

	const handleUploadConfirm = async (croppedFile, name, isForSale) => {
		const { id, url } = await handleUploadImage({
			fileData: croppedFile?.data,
			name: croppedFile?.filename,
			uri: croppedFile?.path,
			size: croppedFile?.size,
			type: croppedFile?.mime
		});

		const category = 'Among Us';

		const request: ApiClanStickerAddRequest = {
			id,
			category,
			clan_id: currentClanId,
			shortname: name,
			source: url,
			media_type: 0,
			is_for_sale: isForSale
		};
		if (isForSale) {
			const fileData = await createBlurredWatermarkedImageFile(croppedFile?.data);

			const { id } = await handleUploadImage({
				fileData,
				name: croppedFile?.modificationDate,
				uri: croppedFile?.path,
				size: croppedFile?.size,
				type: croppedFile?.mime
			});
			request.id = id;
		}
		dispatch(createSticker({ request, clanId: currentClanId }));
	};

	const ListHeaderComponent = () => {
		return (
			<View style={styles.header}>
				<Pressable style={styles.addButton} onPress={handleUploadSticker}>
					<Text style={styles.buttonText}>{t('btn.upload')}</Text>
				</Pressable>
				<Text style={[styles.text, styles.textTitle]}>{t('content.requirements')}</Text>
				<Text style={[styles.text, styles.textDescription]}>{t('content.reqType')}</Text>
				<Text style={[styles.text, styles.textDescription]}>{t('content.reqDim')}</Text>
				<Text style={[styles.text, styles.textDescription]}>{t('content.reqSize')}</Text>
			</View>
		);
	};
	return (
		<View style={styles.container}>
			<StickerList listSticker={listSticker} clanID={currentClanId} ListHeaderComponent={ListHeaderComponent} />
			{watermarkState?.isProcessing && (
				<WebView
					source={{ html: watermarkState?.html }}
					style={{
						position: 'absolute'
					}}
					onMessage={handleWebViewMessage}
					javaScriptEnabled={true}
					domStorageEnabled={true}
				/>
			)}
		</View>
	);
}
