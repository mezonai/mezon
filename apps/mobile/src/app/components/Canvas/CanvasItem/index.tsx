import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { CanvasAPIEntity } from '@mezon/store-mobile';
import { ApiAccount } from 'mezon-js/api.gen';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

type CanvasItemProps = {
	canvas: CanvasAPIEntity;
	currentUser: ApiAccount;
	creatorIdChannel: string;
	onPressItem?: () => void;
	onPressDelete?: (canvasId: string) => void;
	onCopyLink?: (canvasId: string) => void;
};

const CanvasItem = memo(({ canvas, currentUser, creatorIdChannel, onPressItem, onPressDelete, onCopyLink }: CanvasItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const title = canvas?.title ? canvas?.title?.replace(/\n/g, ' ') : 'Untitled';
	const isDisableDelCanvas = Boolean(
		canvas.creator_id && canvas.creator_id !== currentUser?.user?.id && creatorIdChannel !== currentUser?.user?.id
	);

	const handleDeleteCanvas = () => {
		onPressDelete(canvas?.id);
	};

	const handleCopyLinkToClipboard = () => {
		onCopyLink(canvas?.id);
	};

	return (
		<TouchableOpacity style={styles.container} onPress={onPressItem}>
			<Text style={styles.title} numberOfLines={1}>
				{title}
			</Text>
			<View style={styles.buttonGroup}>
				<TouchableOpacity style={styles.button} onPress={handleCopyLinkToClipboard}>
					<MezonIconCDN icon={IconCDN.linkIcon} height={size.s_16} width={size.s_16} color={themeValue.text} />
				</TouchableOpacity>
				{!isDisableDelCanvas && (
					<TouchableOpacity style={styles.button} onPress={handleDeleteCanvas}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={size.s_20} width={size.s_20} color={baseColor.redStrong} />
					</TouchableOpacity>
				)}
			</View>
		</TouchableOpacity>
	);
});

export default CanvasItem;
