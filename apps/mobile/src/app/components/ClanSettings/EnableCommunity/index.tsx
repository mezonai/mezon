import { size, useTheme } from '@mezon/mobile-ui';
import {
	comunityActions,
	selectCommunityStateByClanId,
	selectCurrentClanId,
	selectIsCommunityEnabled,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { MAX_FILE_SIZE_10MB } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Keyboard, Platform, Pressable, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../../componentUI/MezonImagePicker';
import MezonInput from '../../../componentUI/MezonInput';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import StatusBarHeight from '../../StatusBarHeight/StatusBarHeight';
import { style } from './styles';

const { width } = Dimensions.get('window');
type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.ENABLE_COMMUNITY;

const URLPrefix = React.memo(({ styles }: { styles: ReturnType<typeof style> }) => (
	<View style={styles.urlPrefix}>
		<Text style={styles.urlPrefixText}>mezon.ai/clans/clan/</Text>
	</View>
));
URLPrefix.displayName = 'URLPrefix';

const EnableCommunityScreen = ({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['onBoardingClan']);
	const dispatch = useAppDispatch();

	const clanId = useAppSelector(selectCurrentClanId);
	const isEnabled = useAppSelector((state) => selectIsCommunityEnabled(state, clanId));
	const communityState = useAppSelector((state) => selectCommunityStateByClanId(state, clanId));

	const [communityData, setCommunityData] = useState({
		bannerUri: null as string | null,
		description: '',
		about: '',
		vanityUrl: ''
	});
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState({
		banner: false,
		description: false,
		about: false,
		vanityUrl: false
	});

	useEffect(() => {
		dispatch(comunityActions.getCommunityInfo({ clan_id: clanId }));
	}, []);

	useEffect(() => {
		setCommunityData({
			bannerUri: communityState?.communityBanner ?? null,
			description: communityState?.description ?? '',
			about: communityState?.about ?? '',
			vanityUrl: communityState?.short_url ?? ''
		});
	}, [communityState]);

	const hasCommunityChanged = useMemo(() => {
		return (
			isEnabled &&
			!!communityState &&
			(communityState.communityBanner !== communityData?.bannerUri ||
				(communityState.description ?? '') !== communityData?.description.trim() ||
				(communityState.about ?? '') !== communityData?.about.trim() ||
				(communityState.short_url ?? '') !== communityData?.vanityUrl.trim())
		);
	}, [communityData, communityState, isEnabled]);

	const validate = useCallback(() => {
		const newErrors = {
			banner: !communityData?.bannerUri,
			description: !communityData?.description.trim(),
			about: !communityData?.about.trim(),
			vanityUrl: !communityData?.vanityUrl.trim()
		};
		setErrors(newErrors);
		return !Object.values(newErrors).some(Boolean);
	}, [communityData]);

	const onSubmit = useCallback(async () => {
		if (!validate()) return;
		Keyboard.dismiss();
		setSubmitting(true);
		try {
			await dispatch(
				comunityActions.updateCommunity({
					clan_id: clanId,
					bannerUrl: communityData?.bannerUri,
					description: communityData?.description.trim(),
					about: communityData?.about.trim(),
					short_url: communityData?.vanityUrl.trim(),
					enabled: true
				})
			)
				.unwrap()
				.then(() => {
					Toast.show({ type: 'success', text1: t('communitySettings.messages.communityEnabledAndSaved') });
					navigation.goBack();
				})
				.catch((error) => {
					throw error;
				});
		} catch (err) {
			console.error(err);
			Toast.show({ type: 'error', text1: t('communitySettings.messages.saveFailed') });
		} finally {
			setSubmitting(false);
		}
	}, [validate, dispatch, clanId, communityData, t, navigation]);

	const onDisable = useCallback(async () => {
		setSubmitting(true);
		try {
			await dispatch(comunityActions.updateCommunityStatus({ clan_id: clanId, enabled: false }))
				.unwrap()
				.then(() => {
					Toast.show({ type: 'success', text1: t('communitySettings.messages.communityDisabled') });
					navigation.goBack();
				})
				.catch((error) => {
					throw error;
				});
		} catch (err) {
			console.error(err);
			Toast.show({ type: 'error', text1: t('communitySettings.messages.disableFailed') });
		} finally {
			setSubmitting(false);
		}
	}, [clanId, dispatch, navigation, t]);

	const onEditCommunity = useCallback(async () => {
		if (!validate()) return;
		Keyboard.dismiss();
		setSubmitting(true);

		const errors: string[] = [];

		try {
			const promises: Promise<unknown>[] = [];

			if (communityState.communityBanner !== communityData?.bannerUri) {
				promises.push(
					dispatch(
						comunityActions.updateCommunityBanner({
							clan_id: clanId,
							bannerUrl: communityData?.bannerUri
						})
					)
						.unwrap()
						.catch((err) => {
							errors.push(t('communitySettings.messages.bannerUpdateFailed'));
							console.error('Banner update error:', err);
						})
				);
			}

			if (communityState.description !== communityData?.description) {
				promises.push(
					dispatch(
						comunityActions.updateCommunityDescription({
							clan_id: clanId,
							description: communityData?.description.trim()
						})
					)
						.unwrap()
						.catch((err) => {
							errors.push(t('communitySettings.messages.descriptionUpdateFailed'));
							console.error('Description update error:', err);
						})
				);
			}

			if (communityState.about !== communityData?.about) {
				promises.push(
					dispatch(
						comunityActions.updateCommunityAbout({
							clan_id: clanId,
							about: communityData?.about.trim()
						})
					)
						.unwrap()
						.catch((err) => {
							errors.push(t('communitySettings.messages.aboutUpdateFailed'));
							console.error('About update error:', err);
						})
				);
			}

			if (communityState.short_url !== communityData?.vanityUrl) {
				promises.push(
					dispatch(
						comunityActions.updateCommunityShortUrl({
							clan_id: clanId,
							short_url: communityData?.vanityUrl.trim()
						})
					)
						.unwrap()
						.catch((err) => {
							errors.push(t('communitySettings.messages.vanityUrlUpdateFailed'));
							console.error('Short URL update error:', err);
						})
				);
			}

			await Promise.all(promises);

			if (errors.length > 0) {
				Toast.show({
					type: 'error',
					text2: errors?.[0]
				});
			} else {
				Toast.show({
					type: 'success',
					text1: t('communitySettings.messages.changesSaved')
				});
				navigation.goBack();
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			Toast.show({
				type: 'error',
				text1: t('communitySettings.messages.saveFailed')
			});
		} finally {
			setSubmitting(false);
		}
	}, [communityData, clanId, communityState, dispatch, validate, t, navigation]);

	const handlePressSaveButton = useCallback(() => {
		if (hasCommunityChanged) {
			onEditCommunity();
		} else if (isEnabled) {
			onDisable();
		} else {
			onSubmit();
		}
	}, [hasCommunityChanged, isEnabled, onDisable, onSubmit, onEditCommunity]);

	const handleChange = (field: keyof typeof communityData, value: string) => {
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
		setCommunityData((prev) => ({ ...prev, [field]: value }));
	};

	const handleLoad = (url: string) => {
		if (errors.banner) setErrors((prev) => ({ ...prev, banner: false }));
		setCommunityData((prev) => ({ ...prev, bannerUri: url }));
	};

	const handleResetValues = useCallback(() => {
		setCommunityData({
			bannerUri: communityState?.communityBanner ?? null,
			description: communityState?.description ?? '',
			about: communityState?.about ?? '',
			vanityUrl: communityState?.short_url ?? ''
		});
	}, [communityState]);
	return (
		<KeyboardAvoidingView
			behavior={'padding'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
			style={styles.container}
		>
			<StatusBarHeight />
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={navigation.goBack}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
				</Pressable>
				<View style={styles.titleWrapper}>
					<Text style={styles.name} numberOfLines={1}>
						{t('communitySettings.title')}
					</Text>
				</View>
				{isEnabled && hasCommunityChanged && (
					<Pressable style={styles.backButton} onPress={handleResetValues}>
						<Text style={styles.resetButton}>{t('communitySettings.buttons.reset')}</Text>
					</Pressable>
				)}
			</View>
			<KeyboardAwareScrollView bottomOffset={100} style={styles.form} keyboardShouldPersistTaps="handled">
				<View style={styles.banner}>
					<MezonIconCDN icon={IconCDN.community} height={size.s_200} width={width - size.s_100} useOriginalColor />
				</View>

				<Text style={styles.label}>{t('communitySettings.banner.title')}</Text>
				<MezonImagePicker
					defaultValue={communityData?.bannerUri}
					height={size.s_100}
					width={width - size.s_32}
					onLoad={handleLoad}
					showHelpText
					autoUpload
					imageSizeLimit={MAX_FILE_SIZE_10MB}
					imageHeight={400}
					imageWidth={400}
					style={[styles.imagePicker, errors.banner && styles.inputError]}
				/>

				<Text style={styles.label}>{t('communitySettings.description.title')}</Text>
				<MezonInput
					value={communityData?.description}
					onTextChange={(val) => handleChange('description', val)}
					placeHolder={t('communitySettings.description.placeholder')}
					inputWrapperStyle={[styles.multiline, errors.description && styles.inputError]}
					maxCharacter={100}
					textarea
				/>

				<Text style={styles.label}>{t('communitySettings.about.title')}</Text>
				<MezonInput
					value={communityData?.about}
					onTextChange={(val) => handleChange('about', val)}
					placeHolder={t('communitySettings.about.placeholder')}
					inputWrapperStyle={[styles.multiline, errors.about && styles.inputError]}
					maxCharacter={300}
					textarea
				/>

				<Text style={styles.label}>{t('communitySettings.vanityUrl.title')}</Text>
				<Text style={styles.description}>{t('communitySettings.vanityUrl.description')}</Text>
				<MezonInput
					value={communityData?.vanityUrl}
					onTextChange={(val) => handleChange('vanityUrl', val)}
					placeHolder={t('communitySettings.vanityUrl.placeholder')}
					inputWrapperStyle={[styles.input, errors.vanityUrl && styles.inputError]}
					keyboardType="url"
					prefixIcon={<URLPrefix styles={styles} />}
				/>
			</KeyboardAwareScrollView>

			<TouchableOpacity
				style={[styles.submitButton, isEnabled && !hasCommunityChanged && styles.buttonDisabled]}
				onPress={handlePressSaveButton}
				disabled={submitting}
			>
				<Text style={styles.submitText}>
					{submitting
						? t('communitySettings.buttons.saving')
						: hasCommunityChanged
							? t('communitySettings.buttons.save')
							: isEnabled
								? t('communitySettings.buttons.disable')
								: t('communitySettings.buttons.enableAndSave')}
				</Text>
			</TouchableOpacity>
		</KeyboardAvoidingView>
	);
};

export default EnableCommunityScreen;
