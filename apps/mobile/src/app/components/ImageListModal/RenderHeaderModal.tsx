import { Icons } from '@mezon/mobile-components';
import { Colors, size, Text, useTheme } from '@mezon/mobile-ui';
import { AttachmentEntity, selectDmGroupCurrentId, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { convertTimeString } from '@mezon/utils';
import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../componentUI/MezonClanAvatar';
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
	const uploader = useAppSelector((state) => selectMemberClanByUserId2(state, imageSelected?.uploader || ''));
	const { downloadImage, saveImageToCameraRoll } = useImage();
	const currentDirectId = useSelector(selectDmGroupCurrentId);
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
				await saveImageToCameraRoll('file://' + filePath, filetypeParts[0], false);
			}
			onImageSaved();
		} catch (error) {
			console.error(error);
		}
		onLoading(false);
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
					<Icons.ArrowLargeLeftIcon color={Colors.white} />
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
			<TouchableOpacity onPress={handleDownloadImage}>
				<Icons.DownloadIcon color={Colors.white} />
			</TouchableOpacity>
		</View>
	);
});
