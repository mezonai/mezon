import { Icons } from '@mezon/mobile-components';
import { Block, Colors, size, Text, useTheme } from '@mezon/mobile-ui';
import { AttachmentEntity, selectMemberClanByUserId } from '@mezon/store-mobile';
import { convertTimeString } from '@mezon/utils';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { MezonClanAvatar } from '../../componentUI';
import { useImage } from '../../hooks/useImage';
import { style } from './styles';

interface IRenderFooterModalProps {
	onClose?: () => void;
	imageSelected?: AttachmentEntity;
	onImageSaved?: () => void;
	onLoading?: (isLoading: boolean) => void;
}

export const RenderHeaderModal = React.memo(({ onClose, imageSelected, onImageSaved, onLoading }: IRenderFooterModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const uploader = useSelector(selectMemberClanByUserId(imageSelected?.uploader || ''));
	const { downloadImage, saveImageToCameraRoll } = useImage();
	const handleDownloadImage = async () => {
		if (!imageSelected?.url) {
			return;
		}
		onLoading(true);
		try {
			const { url, filetype } = imageSelected;
			const filetypeParts = filetype.split('/');
			const filePath = await downloadImage(url, filetypeParts[1]);
			if (filePath) {
				await saveImageToCameraRoll('file://' + filePath, filetypeParts[0]);
			}
			onImageSaved();
		} catch (error) {
			console.error(error);
		}
		onLoading(false);
	};

	return (
		<Block
			position="absolute"
			paddingTop={size.s_30}
			left={0}
			zIndex={1}
			justifyContent="space-between"
			flexDirection="row"
			backgroundColor="rgba(0, 0, 0, 0.4)"
			width="100%"
			padding={size.s_10}
			alignItems="center"
		>
			<Block flexDirection="row" alignItems="center" gap={size.s_10}>
				<TouchableOpacity onPress={onClose}>
					<Icons.ArrowLargeLeftIcon color={Colors.white} />
				</TouchableOpacity>
				{!!uploader && (
					<Block flexDirection={'row'} alignItems={'center'} gap={size.s_6}>
						<Block style={styles.wrapperAvatar}>
							<MezonClanAvatar image={uploader?.clan_avatar || uploader?.user?.avatar_url} />
						</Block>
						<Block style={styles.messageBoxTop}>
							<Text style={styles.userNameMessageBox}>{uploader?.user?.username || 'Anonymous'}</Text>
							<Text style={styles.dateMessageBox}>
								{imageSelected?.create_time ? convertTimeString(imageSelected?.create_time) : ''}
							</Text>
						</Block>
					</Block>
				)}
			</Block>
			<TouchableOpacity onPress={handleDownloadImage}>
				<Icons.DownloadIcon color={Colors.white} />
			</TouchableOpacity>
		</Block>
	);
});
