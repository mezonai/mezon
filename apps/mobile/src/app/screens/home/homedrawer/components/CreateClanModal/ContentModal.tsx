import { useClans } from '@mezon/core';
import { AddIcon, QUALITY_IMAGE_UPLOAD, save, setDefaultChannelLoader, STORAGE_CLAN_ID, UploadImage } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import { channelsActions, checkDuplicateNameClan, clansActions, getStoreAsync, selectCurrentChannel } from '@mezon/store-mobile';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Keyboard, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import RNFS from 'react-native-fs';
import * as ImagePicker from 'react-native-image-picker';
import { CameraOptions } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MezonButton } from '../../../../../componentUI/MezonButton';
import { IFile } from '../../../../../componentUI/MezonImagePicker';
import MezonInput from '../../../../../componentUI/MezonInput';
import { validInput } from '../../../../../utils/validate';
import { style } from './CreateClanModal.styles';

interface ICreateClanProps {
	visible: boolean;
	setVisible: (value: boolean) => void;
}
const CreateClanModal = memo(({ visible, setVisible }: ICreateClanProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [nameClan, setNameClan] = useState<string>('');
	const [urlImage, setUrlImage] = useState('');
	const [isCheckValid, setIsCheckValid] = useState<boolean>();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const currentChannel = useSelector(selectCurrentChannel);
	const { t } = useTranslation(['clan']);
	const { sessionRef, clientRef } = useMezon();
	const { createClans } = useClans();
	const handleCreateClan = async () => {
		const store = await getStoreAsync();
		const isDuplicate = await store.dispatch(checkDuplicateNameClan(nameClan.trim()));
		if (isDuplicate?.payload) {
			Toast.show({
				type: 'error',
				text1: t('duplicateNameMessage')
			});
			return;
		}
		setIsSubmitting(true);
		createClans(nameClan?.trim?.(), urlImage)
			.then(async (res) => {
				if (res && res?.clan_id) {
					store.dispatch(clansActions.joinClan({ clanId: res?.clan_id }));
					save(STORAGE_CLAN_ID, res?.clan_id);
					store.dispatch(clansActions.changeCurrentClan({ clanId: res?.clan_id }));
					const respChannel = await store.dispatch(channelsActions.fetchChannels({ clanId: res?.clan_id }));
					await setDefaultChannelLoader(respChannel.payload, res?.clan_id);
					setVisible(false);
				}
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	};

	useEffect(() => {
		setIsCheckValid(validInput(nameClan));
	}, [nameClan]);

	useEffect(() => {
		if (!visible) {
			setUrlImage('');
			setNameClan('');
		}
	}, [visible]);

	const onOpen = async () => {
		const options = {
			durationLimit: 10000,
			mediaType: 'photo',
			quality: QUALITY_IMAGE_UPLOAD
		};

		ImagePicker.launchImageLibrary(options as CameraOptions, async (response) => {
			if (response.didCancel) {
				console.warn('User cancelled camera');
			} else if (response.errorCode) {
				console.error('Camera Error: ', response.errorMessage);
			} else {
				const file = response.assets[0];
				const fileData = await RNFS.readFile(file.uri, 'base64');
				const fileFormat: IFile = {
					uri: file?.uri,
					name: file?.fileName,
					type: file?.type,
					size: file?.fileSize?.toString(),
					fileData
				};
				handleFile([fileFormat][0]);
			}
		});
	};

	const handleFile = async (file: IFile | any) => {
		const session = sessionRef.current;
		const client = clientRef.current;
		if (!file || !client || !session) {
			throw new Error('Client or files are not initialized');
		}
		const res = await handleUploadFileMobile(client, session, currentChannel?.clan_id, currentChannel?.channel_id, file.name, file);
		if (!res.url) return;
		setUrlImage(res.url);
	};

	return (
		<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
			<View style={styles.wrapperCreateClanModal}>
				<Text style={styles.headerTitle}>{t('title')}</Text>
				<Text style={styles.headerSubTitle}>{t('subTitle')}</Text>
				<View style={styles.boxImage}>
					<TouchableOpacity style={styles.uploadImage} onPress={onOpen}>
						{!urlImage ? (
							<View style={[styles.uploadCreateClan]}>
								<AddIcon style={styles.addIcon} height={size.s_30} width={size.s_30} color={Colors.bgButton} />
								<UploadImage height={size.s_20} width={size.s_20} color={Colors.bgGrayLight} />
								<Text style={styles.uploadText}>{t('upload')}</Text>
							</View>
						) : (
							<View style={[styles.uploadCreateClan, styles.overflowImage]}>
								<Image source={{ uri: urlImage }} style={styles.image} />
							</View>
						)}
					</TouchableOpacity>
				</View>

				<MezonInput
					label={t('clanName')}
					onTextChange={setNameClan}
					placeHolder={t('placeholderClan')}
					value={nameClan}
					maxCharacter={64}
					disabled={isSubmitting}
					errorMessage={t('errorMessage')}
				/>

				<Text style={styles.community}>
					{t('byCreatingClan')} <Text style={styles.communityGuideLines}>Community Guidelines.</Text>
				</Text>
				<MezonButton disabled={!isCheckValid || isSubmitting} viewContainerStyle={styles.button} onPress={handleCreateClan}>
					<Text style={styles.buttonText}>{t('createServer')}</Text>
				</MezonButton>
			</View>
		</TouchableWithoutFeedback>
	);
});

export default CreateClanModal;
