import { abbreviateText } from '@mezon/mobile-components';
import { verticalScale } from '@mezon/mobile-ui';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
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
	return (
		<View style={styles.fileViewer}>
			<MezonIconCDN icon={IconCDN.fileIcon} width={verticalScale(30)} height={verticalScale(30)} color={'#5a62f4'} />
			<View style={{ maxWidth: '75%' }}>
				<Text style={styles.fileName} numberOfLines={1}>
					{abbreviateText(attachment.filename)}
				</Text>
				<Text style={styles.typeFile} numberOfLines={1}>
					{type}
				</Text>
			</View>
		</View>
	);
};

export default React.memo(AttachmentFilePreview);
