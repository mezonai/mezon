import { useClans } from '@mezon/core';
import { ActionEmitEvent, save, setDefaultChannelLoader, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { channelsActions, checkDuplicateNameClan, clansActions, getStoreAsync, selectCurrentChannel } from '@mezon/store-mobile';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import { MAX_FILE_SIZE_1MB } from '@mezon/utils';
import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import type { CameraOptions } from 'react-native-image-picker';
import * as ImagePicker from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import MezonButton from '../../../../../componentUI/MezonButton';
import MezonClanAvatar from '../../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import type { IFile } from '../../../../../componentUI/MezonImagePicker';
import MezonInput from '../../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useCheckClanLimit from '../../../../../hooks/useCheckClanLimit';
import { validInput } from '../../../../../utils/validate';
import { style } from './CreateClanModal.styles';

const CreateClanModal = memo(() => {
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
	const { checkClanLimit } = useCheckClanLimit();

	const onClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	const handleCreateClan = async () => {
		const isClanLimit = checkClanLimit();
		if (isClanLimit) {
			return;
		}
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
					onClose();
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
		setUrlImage('');
		setNameClan('');
	}, []);

	const onOpen = async () => {
		const options = {
			durationLimit: 10000,
			mediaType: 'photo'
		};

		ImagePicker.launchImageLibrary(options as CameraOptions, async (response) => {
			if (response.didCancel) {
				console.warn('User cancelled camera');
			} else if (response.errorCode) {
				console.error('Camera Error: ', response.errorMessage);
			} else {
				const file = response.assets[0];
				if (file?.fileSize && file?.fileSize > MAX_FILE_SIZE_1MB) {
					Toast.show({
						type: 'error',
						text1: t('createClanModal.toast.limitImageSize', { size: MAX_FILE_SIZE_1MB / 1024 / 1024 })
					});
					return;
				}
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
		<View style={styles.wrapperCreateClanModal}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>

			<View style={styles.headerContainer}>
				<TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
					<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.text} width={size.s_30} height={size.s_30} />
				</TouchableOpacity>
				<Text style={[styles.title, { color: themeValue.text }]}>{t('title')}</Text>
				<Text style={[styles.description, { color: themeValue.textDisabled }]}>{t('subTitle')}</Text>
			</View>
			<View style={styles.boxImage}>
				<TouchableOpacity style={styles.uploadImage} onPress={onOpen}>
					{!urlImage ? (
						<View style={[styles.uploadCreateClan]}>
							<MezonIconCDN
								icon={IconCDN.circlePlusPrimaryIcon}
								customStyle={styles.addIcon}
								height={size.s_30}
								width={size.s_30}
								color={'#5865f2'}
							/>
							<MezonIconCDN icon={IconCDN.cameraIcon} height={size.s_20} width={size.s_20} color={'#676b73'} />
							<Text style={styles.uploadText}>{t('upload')}</Text>
						</View>
					) : (
						<View style={[styles.uploadCreateClan, styles.overflowImage]}>
							<MezonClanAvatar image={urlImage} imageHeight={400} imageWidth={400} />
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
			<MezonButton
				disabled={!isCheckValid || isSubmitting}
				containerStyle={styles.button}
				onPress={handleCreateClan}
				title={t('createServer')}
				titleStyle={styles.buttonText}
			/>
		</View>
	);
});

export default CreateClanModal;
