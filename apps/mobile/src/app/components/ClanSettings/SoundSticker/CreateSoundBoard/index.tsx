import { Fonts, useTheme } from '@mezon/mobile-ui';
import { appActions, MediaType, selectCurrentClanId, soundEffectActions, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { pick, types } from '@react-native-documents/picker';
import { Snowflake } from '@theinternetfolks/snowflake';
import { getEmojiAndStickerId } from 'apps/mobile/src/app/utils/helpers';
import { Buffer as BufferMobile } from 'buffer';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../constants/icon_cdn';
import type { APP_SCREEN, MenuClanScreenProps } from '../../../../navigation/ScreenTypes';
import RenderAudioChat from '../../../../screens/home/homedrawer/components/RenderAudioChat';
import { CLAN_MEDIA_NAME_REGEX, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '../../Emoji/EmojiPreview';
import { style } from './styles';

type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.CREATE_SOUND;
export function CreateSoundScreen({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const [audioFile, setAudioFile] = useState<any>(null);
	const [soundName, setSoundName] = useState<string>('');
	const isDisabledUpload = useMemo(() => !audioFile || !soundName.trim(), [audioFile, soundName]);
	const styles = style(themeValue, isDisabledUpload);
	const { t } = useTranslation(['clanSoundSetting']);
	const [audioUrl, setAudioUrl] = useState<string>('');
	const [error, setError] = useState<string>('');
	const buttonRef = useRef<any>(null);
	const { sessionRef, clientRef } = useMezon();
	const dispatch = useAppDispatch();
	const currentClanId = useAppSelector(selectCurrentClanId);

	const onAudioPick = async () => {
		setAudioUrl('');
		try {
			buttonRef.current.disabled = true;
			const res = await pick({
				type: [types.audio]
			});
			if (!res || res.length === 0) {
				return;
			}
			if (res?.[0]?.size > 1024 * 1024) {
				Toast.show({
					type: 'error',
					text1: t('toast.errorSizeLimit')
				});
				throw new Error('File size exceeds the limit of 1MB');
			}
			if (!['audio/mp3', 'audio/mpeg', 'audio/wav'].includes(res?.[0]?.type)) {
				Toast.show({
					type: 'error',
					text1: t('toast.errorFileType')
				});
				throw new Error('Invalid file format');
			}
			setAudioFile(res?.[0]);
			const uri = await getPlayUrl(res?.[0]?.uri);
			setAudioUrl(uri);
			buttonRef.current.disabled = false;
		} catch (error) {
			buttonRef.current.disabled = false;
		}
	};

	const getPlayUrl = async (url: string) => {
		const destPath = `${RNFS.CachesDirectoryPath}/temp_audio.mp3`;
		await RNFS.copyFile(url, destPath);
		return destPath;
	};

	const uploadSound = async () => {
		if (!audioFile || !soundName.trim()) return;

		if (!(soundName?.trim()?.length >= MIN_NAME_LENGTH && soundName?.length <= MAX_NAME_LENGTH && CLAN_MEDIA_NAME_REGEX.test(soundName))) {
			setError(
				t('modal.errorName', {
					max: MAX_NAME_LENGTH,
					min: MIN_NAME_LENGTH
				})
			);
			return;
		}

		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!client || !session) {
				throw new Error('Client or session is not initialized');
			}

			const id = Snowflake.generate();
			const path = `sounds/${id}.${audioFile.name.split('.').pop()}`;

			const base64 = await RNFS.readFile(audioUrl, 'base64');
			const arrayBuffer = BufferMobile.from(base64, 'base64');

			const attachment = await handleUploadEmoticon(client, session, path, audioFile, true, arrayBuffer);

			const soundId = getEmojiAndStickerId(attachment?.url);

			if (attachment && attachment.url) {
				const request = {
					id: soundId,
					category: 'Among Us',
					clanId: currentClanId,
					shortname: soundName.trim(),
					source: attachment.url,
					media_type: MediaType.AUDIO
				};

				await dispatch(soundEffectActions.createSound({ request, clanId: currentClanId }));

				navigation.goBack();
			}
		} catch (error) {
			console.error('Error uploading sound:', error);
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const handleSetSoundName = (value: string) => {
		setError('');
		setSoundName(value);
	};

	return (
		<View style={styles.container}>
			{!!audioUrl && (
				<View>
					<Text style={styles.title}>{t('content.preview')}</Text>
					<View style={styles.preview}>
						<RenderAudioChat audioURL={audioUrl || ''} stylesContainerCustom={styles.previewContainer} />
					</View>
				</View>
			)}
			<View style={styles.audioFile}>
				<View style={styles.inputContainer}>
					<MezonInput label={t('content.audioFile')} disabled placeHolder={t('content.chooseAudioFile')} value={audioFile?.name || ''} />
				</View>
				<Pressable style={styles.uploadButton} onPress={onAudioPick} ref={buttonRef}>
					<MezonIconCDN icon={IconCDN.shareIcon} height={Fonts.size.s_20} width={Fonts.size.s_20} color="white" />
				</Pressable>
			</View>
			<MezonInput
				label={t('content.audioName')}
				placeHolder="Ex.cathug"
				maxCharacter={MAX_NAME_LENGTH}
				onTextChange={handleSetSoundName}
				errorMessage={error}
			/>
			<Pressable style={styles.button} onPress={uploadSound} ref={buttonRef} disabled={isDisabledUpload}>
				<Text style={styles.buttonTitle}>{t('button.uploadDetailScreen')}</Text>
			</Pressable>
		</View>
	);
}
