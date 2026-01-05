import { size, useTheme } from '@mezon/mobile-ui';
import { selectOpenThreadMessageState } from '@mezon/store-mobile';
import { ChannelStatusEnum, ChannelThreads } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './HeaderLeftThreadForm.style';

const HeaderLeftThreadForm = ({ currentChannel }: { currentChannel: ChannelThreads }) => {
	const { themeValue } = useTheme();
	const navigation = useNavigation();
	const styles = style(themeValue);
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { t } = useTranslation(['createThread']);

	return (
		<View style={styles.headerLeft}>
			<TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()}>
				<MezonIconCDN icon={IconCDN.chevronSmallLeftIcon} color={themeValue.textStrong} />
			</TouchableOpacity>
			<View>
				<View style={styles.titleRow}>
					{!openThreadMessageState && (
						<View style={styles.iconContainer}>
							{currentChannel?.channelPrivate === ChannelStatusEnum.isPrivate &&
							currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ? (
								<MezonIconCDN icon={IconCDN.channelTextLock} width={18} height={18} color={themeValue.textStrong} />
							) : (
								<MezonIconCDN icon={IconCDN.channelText} width={18} height={18} color={themeValue.textStrong} />
							)}
						</View>
					)}
					<Text style={[styles.titleText, { color: themeValue.textStrong }]}>
						{openThreadMessageState ? t('newThread', { ns: 'createThread' }) : currentChannel?.channelLabel}
					</Text>
					<MezonIconCDN
						icon={IconCDN.chevronSmallRightIcon}
						width={14}
						height={14}
						customStyle={{ marginLeft: 5 }}
						color={themeValue.text}
					/>
				</View>
				{openThreadMessageState && (
					<Text numberOfLines={1} style={[styles.subtitleText, { color: themeValue.text }]}>
						{currentChannel?.channelLabel}
					</Text>
				)}
			</View>
		</View>
	);
};

export default HeaderLeftThreadForm;
