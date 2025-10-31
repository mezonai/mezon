import { abbreviateText } from '@mezon/mobile-components';
import { useTheme, verticalScale } from '@mezon/mobile-ui';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React from 'react';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import styles from './styles';

interface IProps {
	attachment: ApiMessageAttachment;
}

const AttachmentFilePreview = ({ attachment }: IProps) => {
	const splitFiletype = attachment?.filetype?.split?.('/');
	const type = splitFiletype?.[splitFiletype?.length - 1];
	const { themeValue } = useTheme();
	return (
		<View style={[styles.fileViewer, { backgroundColor: themeValue.secondaryLight }]}>
			<MezonIconCDN icon={IconCDN.fileIcon} width={verticalScale(30)} height={verticalScale(30)} color={'#5a62f4'} />
			<View style={styles.fileContentWrapper}>
				<Text style={[styles.fileName, { color: themeValue.text }]} numberOfLines={1}>
					{abbreviateText(attachment.filename)}
				</Text>
				<Text style={[styles.typeFile, { color: themeValue.textDisabled }]} numberOfLines={1}>
					{type}
				</Text>
			</View>
		</View>
	);
};

export default React.memo(AttachmentFilePreview);
