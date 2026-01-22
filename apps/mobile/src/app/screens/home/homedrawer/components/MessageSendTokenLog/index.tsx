import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

type MessageSendTokenLogProps = {
	messageContent: string;
};

const MessageSendTokenLog = memo(({ messageContent = ' | ' }: MessageSendTokenLogProps) => {
	const { themeValue } = useTheme();
	const navigation = useNavigation<any>();
	const { t } = useTranslation(['common']);
	const styles = style(themeValue);

	const [title, ...descriptionData] = messageContent.split(' | ');
	const description = descriptionData.join(' | ');

	const handleTransaction = () => {
		navigation.push(APP_SCREEN.WALLET, {
			activeScreen: 'history'
		});
	};

	return (
		<View style={styles.wrapper}>
			<View style={styles.container}>
				<View style={styles.info}>
					<View style={styles.iconContainer}>
						<MezonIconCDN icon={IconCDN.transactionIcon} height={size.s_34} width={size.s_34} color={baseColor.bgSuccess} />
					</View>
					<View style={styles.contentContainer}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.transactionTitle}>
							{`${t('detail')}: `}
							<Text style={styles.lightTitle}>{description}</Text>
						</Text>
					</View>
				</View>
				<View style={styles.seperatedItem} />
				<TouchableOpacity style={styles.transaction} onPress={handleTransaction}>
					<Text style={styles.buttonTitle}>Mezon transfer</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
});

export default MessageSendTokenLog;
