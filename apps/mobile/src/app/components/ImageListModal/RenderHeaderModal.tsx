import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useAppDispatch } from '@mezon/store';
import type { AttachmentEntity } from '@mezon/store-mobile';
import {
	getStore,
	messagesActions,
	selectDmGroupCurrentId,
	selectMemberClanByUserId,
	selectMemberGroupByUserId,
	selectMessageByMessageId
} from '@mezon/store-mobile';
import type { UsersClanEntity } from '@mezon/utils';
import { convertTimeString, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, View } from 'react-native';
import Share from 'react-native-share';
import Tooltip from 'react-native-walkthrough-tooltip';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { useImage } from '../../hooks/useImage';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { isVideo } from '../../utils/helpers';
import { style } from './styles';

interface IRenderFooterModalProps {
	visible: boolean;
	imageSelected?: AttachmentEntity & { channelId?: string; clanId?: string };
	onImageSaved?: () => void;
	onLoading?: (isLoading: boolean) => void;
	onImageCopy?: (error?: string) => void;
	onImageShare?: (error?: string) => void;
	disableGoback?: boolean;
}

export const RenderHeaderModal = memo(
	({ visible, imageSelected, onImageSaved, onLoading, onImageCopy, onImageShare, disableGoback = false }: IRenderFooterModalProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const [showTooltip, setShowTooltip] = useState(false);
		const dispatch = useAppDispatch();
		const { downloadImage, saveMediaToCameraRoll, getImageAsBase64OrFile } = useImage();
		const currentDirectId = useSelector(selectDmGroupCurrentId);
		const navigation = useNavigation<any>();
		const { t } = useTranslation(['common']);
		const uploader = useMemo(() => {
			const store = getStore();
			const currentDirectId = selectDmGroupCurrentId(store.getState());
			if (imageSelected?.clanId === '0' || !!currentDirectId || !imageSelected?.clanId) {
				return selectMemberGroupByUserId(store.getState(), imageSelected?.channelId as string, imageSelected?.uploader as string);
			} else {
				const memberClan = selectMemberClanByUserId(store.getState(), imageSelected?.uploader as string);
				if (memberClan) {
					return memberClan;
				}

				if (imageSelected?.message_id && imageSelected?.channelId) {
					const message = selectMessageByMessageId(store.getState(), imageSelected.channelId, imageSelected.message_id);
					const data = {
						clan_avatar: message?.clan_avatar,
						clan_nick: message?.clan_nick,
						user: {
							avatar_url: message?.avatar,
							username: message?.username,
							display_name: message?.display_name
						}
					} as UsersClanEntity;
					return data;
				}
				return null;
			}
		}, [imageSelected]);

		const onClose = () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		};

		const isAnonymous = useMemo(() => {
			return imageSelected?.uploader === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID;
		}, [imageSelected?.uploader]);

		const prioritySenderUsername = useMemo(() => {
			if (isAnonymous) {
				return 'Anonymous';
			}

			return uploader?.user?.username || '';
		}, [isAnonymous, uploader?.user?.username]);

		const prioritySenderName = useMemo(() => {
			if (isAnonymous) {
				return 'Anonymous';
			}

			const displayName = uploader?.user?.display_name || uploader?.user?.username || '';
			return currentDirectId ? displayName : uploader?.clan_nick || displayName;
		}, [currentDirectId, isAnonymous, uploader?.clan_nick, uploader?.user?.display_name, uploader?.user?.username]);

		const prioritySenderAvatar = useMemo(() => {
			return (currentDirectId ? uploader?.user?.avatar_url : uploader?.clan_avatar || uploader?.user?.avatar_url) || '';
		}, [currentDirectId, uploader?.clan_avatar, uploader?.user?.avatar_url]);

		const handleDownloadImage = async () => {
			setShowTooltip((prev) => !prev);
			if (!imageSelected?.url) return;

			onLoading?.(true);
			try {
				const { url, filetype } = imageSelected;
				const filetypeParts = filetype?.split?.('/');
				const filePath = await downloadImage(url, filetype?.includes('image') ? filetypeParts?.[1] || 'png' : 'png');
				if (filePath) {
					await saveMediaToCameraRoll(`file://${filePath}`, filetype?.includes('image') ? (filetypeParts?.[0] ?? 'image') : 'image', false);
					onImageSaved?.();
				}
			} catch (error) {
				console.error('Error downloading image: ', error);
			} finally {
				onLoading?.(false);
			}
		};

		const handleCopyImage = async () => {
			setShowTooltip((prev) => !prev);
			if (!imageSelected?.url) return;

			onLoading?.(true);
			try {
				const { url, filetype } = imageSelected;
				const image = await getImageAsBase64OrFile(url, filetype?.includes('image') ? filetype?.split?.('/')?.[1] || 'png' : 'png');
				if (image) onImageCopy?.();
			} catch (error) {
				console.error('Error copying image: ', error);
				onImageCopy(error);
			} finally {
				onLoading?.(false);
			}
		};

		const handleShareImage = async () => {
			setShowTooltip((prev) => !prev);
			if (!imageSelected?.url) return;

			onLoading?.(true);
			try {
				const { url, filetype, filename } = imageSelected;

				if (!url) {
					onImageShare?.('No image URL found');
					return;
				}

				const imageData = await getImageAsBase64OrFile(url, filetype?.includes('image') ? filetype?.split?.('/')?.[1] || 'png' : 'png', {
					forSharing: true
				});

				if (!imageData?.filePath) {
					onImageShare?.('Failed to process image');
					return;
				}

				await Share.open({
					url: `file://${imageData.filePath}`,
					type: filetype?.includes('image') ? filetype || 'image/png' : 'image/png',
					filename: filename || 'image',
					failOnCancel: false
				});
			} catch (error) {
				onImageShare?.('Unknown error');
				console.error('Error sharing image: ', error);
			} finally {
				onLoading?.(false);
				onClose();
			}
		};

		const handleForwardMessage = async () => {
			setShowTooltip((prev) => !prev);
			if (!imageSelected?.message_id) return;

			try {
				const store = getStore();
				const message = selectMessageByMessageId(store.getState(), imageSelected?.channelId, imageSelected.message_id);
				if (message) {
					onClose();
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					await sleep(500);
					navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
						screen: APP_SCREEN.MESSAGES.FORWARD_MESSAGE,
						params: {
							message
						}
					});
				}
			} catch (error) {
				console.error('Error forwarding message: ', error);
			}
		};
		const handleJumpToMessage = async () => {
			setShowTooltip((prev) => !prev);
			if (!imageSelected?.message_id) return;

			try {
				onClose();
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				if (!disableGoback) {
					navigation.goBack();
				}
				await sleep(500);
				dispatch(
					messagesActions.jumpToMessage({
						clanId: currentDirectId ? '0' : imageSelected?.clanId,
						messageId: imageSelected?.message_id ?? '',
						channelId: imageSelected?.channelId ?? ''
					})
				);
			} catch (error) {
				console.error('Error forwarding message: ', error);
			}
		};

		const toggleTooltip = () => {
			setShowTooltip((prev) => !prev);
		};

		return (
			<View
				style={[styles.headerContainer, { paddingTop: Platform.OS === 'ios' ? size.s_40 : size.s_30 }, !visible && { height: 0, zIndex: -1 }]}
			>
				<View style={styles.headerLeftSection}>
					<TouchableOpacity onPress={onClose}>
						<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={baseColor.white} />
					</TouchableOpacity>

					<View style={styles.uploaderSection}>
						<View style={styles.wrapperAvatar}>
							<MezonClanAvatar image={prioritySenderAvatar} alt={prioritySenderUsername} />
						</View>
						<View style={styles.messageBoxTop}>
							<Text numberOfLines={1} style={styles.usernameMessageBox}>
								{prioritySenderName}
							</Text>
							<Text style={styles.dateMessageBox}>
								{imageSelected?.create_time ? convertTimeString(imageSelected.create_time, t) : ''}
							</Text>
						</View>
					</View>
				</View>
				<Tooltip
					isVisible={showTooltip}
					content={
						<View style={styles.option}>
							{!isVideo(imageSelected?.url) && (
								<>
									<TouchableOpacity style={styles.itemOption} onPress={handleCopyImage}>
										<Text style={styles.textOption}>{t('copy')}</Text>
										<MezonIconCDN icon={IconCDN.copyIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
									</TouchableOpacity>
									<TouchableOpacity style={styles.itemOption} onPress={handleShareImage}>
										<Text style={styles.textOption}>{t('share')}</Text>
										<MezonIconCDN icon={IconCDN.shareIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
									</TouchableOpacity>
								</>
							)}

							{!isAnonymous && (
								<TouchableOpacity style={styles.itemOption} onPress={handleForwardMessage}>
									<Text style={styles.textOption}>{t('forward')}</Text>
									<MezonIconCDN icon={IconCDN.arrowAngleRightUpIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
								</TouchableOpacity>
							)}
							<TouchableOpacity style={styles.itemOption} onPress={handleDownloadImage}>
								<Text style={styles.textOption}>{t('download')}</Text>
								<MezonIconCDN icon={IconCDN.downloadIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
							</TouchableOpacity>
							<TouchableOpacity style={[styles.itemOption, { borderBottomWidth: 0 }]} onPress={handleJumpToMessage}>
								<Text style={styles.textOption}>{t('jumpToMessage')}</Text>
								<MezonIconCDN icon={IconCDN.forumIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
							</TouchableOpacity>
						</View>
					}
					contentStyle={{
						zIndex: 100,
						backgroundColor: themeValue.primary,
						borderRadius: size.s_10,
						minWidth: size.s_165,
						paddingVertical: size.s_10,
						top: Platform.OS === 'android' ? -size.s_50 : 0,
						left: Platform.OS === 'android' ? size.s_10 : 0
					}}
					arrowSize={{ width: 0, height: 0 }}
					placement="bottom"
					onClose={() => toggleTooltip()}
					closeOnBackgroundInteraction={true}
					disableShadow={true}
					closeOnContentInteraction={true}
				>
					<TouchableOpacity onPress={() => toggleTooltip()} style={styles.iconTooltip}>
						<MezonIconCDN icon={IconCDN.moreVerticalIcon} height={size.s_20} width={size.s_18} color={baseColor.white} />
					</TouchableOpacity>
				</Tooltip>
			</View>
		);
	}
);
