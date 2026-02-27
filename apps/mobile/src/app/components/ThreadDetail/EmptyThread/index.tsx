import { usePermissionChecker } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannelId } from '@mezon/store-mobile';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Icons } from '../../../componentUI/MobileIcons';
import { style } from './EmptyThread.style';

const EmptyThread = ({ onPress }: { onPress: () => void }) => {
	const { themeValue } = useTheme();
	const currentChannelId = useSelector(selectCurrentChannelId);

	const styles = style(themeValue);
	const { t } = useTranslation(['createThread']);
	const [isCanManageThread, isCanManageChannel] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EPermission.manageChannel],
		currentChannelId ?? ''
	);
	return (
		<View style={styles.emptyThreadContainer}>
			<View style={styles.emptyThreadContent}>
				<View style={styles.iconContainer}>
					<Icons.ThreadPlusIcon width={22} height={22} color={themeValue.textStrong} />
				</View>
				<Text style={styles.textNoThread}>{t('emptyThread.textNoThread')}</Text>
				<Text style={styles.textNotify}>{t('emptyThread.textNotify')}</Text>
				{isCanManageThread || isCanManageChannel ? (
					<TouchableOpacity onPress={onPress} style={[styles.button]}>
						<Text style={[styles.buttonText]}>{t('emptyThread.createThreads')}</Text>
					</TouchableOpacity>
				) : (
					<View />
				)}
			</View>
		</View>
	);
};

export default EmptyThread;
