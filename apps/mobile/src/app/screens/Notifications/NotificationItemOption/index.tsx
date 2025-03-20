import { Metrics, useTheme } from '@mezon/mobile-ui';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import { IconCDN } from '../../../constants/icon_cdn';

export default memo(function NotificationItemOption({ onDelete }: { onDelete: () => void }) {
	const { t } = useTranslation(['notification']);
	const { themeValue } = useTheme();

	const menu = useMemo(
		() =>
			[
				{
					items: [
						{
							title: t('removeNotification'),
							icon: <MezonIconCDN icon={IconCDN.trashIcon} height={20} width={20} color={themeValue.textStrong} />,
							onPress: () => {
								onDelete();
							}
						}
					]
				}
			] satisfies IMezonMenuSectionProps[],
		[]
	);

	return (
		<View style={{ padding: Metrics.size.xl }}>
			<MezonMenu menu={menu} />
		</View>
	);
});
