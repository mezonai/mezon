import { size, useTheme } from '@mezon/mobile-ui';
import { appActions, channelsActions, selectChannelById, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { MAX_FILE_SIZE_10MB } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../componentUI/MezonImagePicker';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuChannelScreenProps } from '../../navigation/ScreenTypes';
import { width } from '../ClanSettings/Emoji';
import { style } from './styles';

type ChannelSettingsScreen = typeof APP_SCREEN.MENU_CHANNEL.STREAM_BANNER;
const StreamBannerScreen = ({ navigation, route }: MenuChannelScreenProps<ChannelSettingsScreen>) => {
	const { channelId } = route.params;
	const channel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('streamThumbnail');
	const dispatch = useAppDispatch();
	const [banner, setBanner] = useState('');

	useEffect(() => {
		setBanner(channel?.channel_avatar || '');
	}, [channel]);

	const isBannerChanged = useMemo(() => {
		return banner !== channel?.channel_avatar;
	}, [banner, channel?.channel_avatar]);
	const handleLoad = async (url: string) => {
		if (url) {
			setBanner(url);
		}
	};

	const handleSave = useCallback(async () => {
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			await dispatch(
				channelsActions.updateChannel({
					channel_id: channel?.channel_id,
					channel_label: channel?.channel_label,
					category_id: channel?.category_id,
					app_id: '',
					channel_avatar: banner
				})
			);
			Toast.show({
				type: 'success',
				props: {
					text2: t('saved')
				}
			});
			navigation.goBack();
		} catch (error) {
			console.error(error);
			Toast.show({
				type: 'error',
				text1: t('error.uploadFailed')
			});
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [banner, channel?.category_id, channel?.channel_id, channel?.channel_label, dispatch, navigation, t]);

	const handleClearBanner = () => {
		setBanner('');
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={navigation.goBack}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
				</Pressable>
				<View style={styles.titleWrapper}>
					<Text style={styles.name} numberOfLines={1}>
						{t('title')}
					</Text>
				</View>
				{isBannerChanged && (
					<Pressable style={styles.backButton} onPress={handleSave}>
						<Text style={styles.resetButton}>{t('buttons.change')}</Text>
					</Pressable>
				)}
			</View>
			<View>
				<MezonImagePicker
					defaultValue={banner}
					height={size.s_200}
					width={width - size.s_32}
					onLoad={handleLoad}
					showHelpText
					autoUpload
					imageSizeLimit={MAX_FILE_SIZE_10MB}
					imageHeight={400}
					imageWidth={400}
					style={[styles.imagePicker]}
				/>
				{banner && (
					<Pressable style={styles.clearBannerButton} onPress={handleClearBanner}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={25} width={25} color={themeValue.white} />
					</Pressable>
				)}
			</View>

			<Text style={styles.label}>{t('requirementsTitle')}</Text>
			<View style={styles.requirementCard}>
				<MezonIconCDN icon={IconCDN.imageIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				<View>
					<Text style={[styles.requirementCardText, styles.semibold]}>{t('requirements.format.title')}</Text>
					<Text style={styles.requirementCardText}>{t('requirements.format.value')}</Text>
				</View>
			</View>
			<View style={styles.requirementCard}>
				<MezonIconCDN icon={IconCDN.uploadPlusIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				<View>
					<Text style={[styles.requirementCardText, styles.semibold]}>{t('requirements.resolution.title')}</Text>
					<Text style={styles.requirementCardText}>{t('requirements.resolution.value')}</Text>
				</View>
			</View>
			<View style={styles.requirementCard}>
				<MezonIconCDN icon={IconCDN.attachmentIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				<View>
					<Text style={[styles.requirementCardText, styles.semibold]}>{t('requirements.sizeLimit.title')}</Text>
					<Text style={styles.requirementCardText}>{t('requirements.sizeLimit.value')}</Text>
				</View>
			</View>
		</View>
	);
};

export default StreamBannerScreen;
