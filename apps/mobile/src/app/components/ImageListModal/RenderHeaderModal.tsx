import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	AttachmentEntity,
	getStore,
	selectDmGroupCurrentId,
	selectMemberClanByUserId2,
	selectMessageByMessageId,
	useAppSelector
} from '@mezon/store-mobile';
import { convertTimeString, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { useImage } from '../../hooks/useImage';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';

interface IRenderFooterModalProps {
	onClose?: () => void;
	imageSelected?: AttachmentEntity & { channelId?: string };
	onImageSaved?: () => void;
	onLoading?: (isLoading: boolean) => void;
	onImageCopy?: (error?: string) => void;
}

export const RenderHeaderModal = React.memo(({ onClose, imageSelected, onImageSaved, onLoading, onImageCopy }: IRenderFooterModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const uploader = useAppSelector((state) => selectMemberClanByUserId2(state, imageSelected?.uploader || ''));
	const { downloadImage, saveImageToCameraRoll, getImageAsBase64OrFile } = useImage();
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	const navigation = useNavigation<any>();
	const handleDownloadImage = async () => {
		if (!imageSelected?.url) {
			return;
		}
		onLoading(true);
		try {
			const { url, filetype } = imageSelected;
			const filetypeParts = filetype?.split?.('/');
			const filePath = await downloadImage(url, filetypeParts[1]);
			if (filePath) {
				await saveImageToCameraRoll('file://' + filePath, filetypeParts[0], false);
				onImageSaved();
			}
		} catch (error) {
			// Error is handled silently as the operation is user-facing
		}
		onLoading(false);
	};

	const handleCopyImage = async () => {
		if (!imageSelected?.url) {
			return;
		}
		onLoading(true);
		try {
			const { url, filetype } = imageSelected;
			const type = filetype?.split?.('/');
			const image = await getImageAsBase64OrFile(url, type?.[1]);
			if (image) {
				onImageCopy();
			}
		} catch (error) {
			console.error('Error copying image: ', error);
			onImageCopy(error);
		}
		onLoading(false);
	};

	const handleForwardMessage = async () => {
		if (!imageSelected?.message_id) return;
		try {
			const store = getStore();
			const message = selectMessageByMessageId(store?.getState(), imageSelected?.channelId, imageSelected?.message_id);
			if (message) {
				onClose();
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
					screen: APP_SCREEN.MESSAGES.FORWARD_MESSAGE,
					params: {
						message: message
					}
				});
			}
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<View
			style={{
				position: 'absolute',
				paddingTop: Platform.OS === 'ios' ? size.s_40 : size.s_30,
				left: 0,
				zIndex: 1,
				justifyContent: 'space-between',
				flexDirection: 'row',
				backgroundColor: 'rgba(0, 0, 0, 0.4)',
				width: '100%',
				padding: size.s_10,
				alignItems: 'center'
			}}
		>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_10 }}>
				<TouchableOpacity onPress={onClose}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={'white'} />
				</TouchableOpacity>
				{!!uploader && (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_6 }}>
						<View style={styles.wrapperAvatar}>
							<MezonClanAvatar
								image={currentDirectId ? uploader?.user?.avatar_url : uploader?.clan_avatar || uploader?.user?.avatar_url}
							/>
						</View>
						<View style={styles.messageBoxTop}>
							<Text style={styles.usernameMessageBox}>
								{(currentDirectId
									? uploader?.user?.display_name || uploader?.user?.username
									: uploader?.clan_nick || uploader?.user?.display_name || uploader?.user?.username) || 'Anonymous'}
							</Text>
							<Text style={styles.dateMessageBox}>
								{imageSelected?.create_time ? convertTimeString(imageSelected?.create_time) : ''}
							</Text>
						</View>
					</View>
				)}
			</View>
			<View style={styles.option}>
				<TouchableOpacity onPress={handleCopyImage}>
					<MezonIconCDN icon={IconCDN.copyIcon} color={'white'} height={size.s_20} width={size.s_20} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleForwardMessage}>
					<MezonIconCDN icon={IconCDN.arrowAngleRightUpIcon} color={'white'} height={size.s_20} width={size.s_20} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleDownloadImage}>
					<MezonIconCDN icon={IconCDN.downloadIcon} color={'white'} height={size.s_20} width={size.s_20} />
				</TouchableOpacity>
			</View>
		</View>
	);
});
