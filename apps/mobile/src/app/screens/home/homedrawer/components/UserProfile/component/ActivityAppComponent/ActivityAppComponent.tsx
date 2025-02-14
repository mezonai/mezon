import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectActivityByUserId } from '@mezon/store-mobile';
import { ActivitiesName, ActivitiesType } from '@mezon/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { style } from './ActivityAppComponent.styles';

const iconMap: Partial<Record<ActivitiesType, JSX.Element>> = {
	[ActivitiesType.VISUAL_STUDIO_CODE]: <Icons.VisualStudioCode defaultSize={size.s_28} />,
	[ActivitiesType.SPOTIFY]: <Icons.Spotify defaultSize={size.s_36} />,
	[ActivitiesType.LOL]: <Icons.LoLGame defaultSize={size.s_28} />
};

function ActivityAppComponent({ userId }: { userId: string }) {
	const activityByUserId = useSelector(selectActivityByUserId(userId || ''));
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['activityApp']);

	const activityNames: { [key: string]: string } = {
		[ActivitiesName.CODE]: t('visualStudioCode'),
		[ActivitiesName.SPOTIFY]: t('listeningToSpotify'),
		[ActivitiesName.LOL]: t('leagueOfLegends')
	};

	if (!activityByUserId) return null;
	return (
		<View>
			<Text style={styles.activityAppLabel}>{t('activity')}</Text>
			<View style={styles.activityAppContainer}>
				{iconMap[activityByUserId?.activity_type]}
				<View style={{ flex: 1 }}>
					<Text style={styles.activityAppText} numberOfLines={1}>
						{activityNames[activityByUserId?.activity_name as string]}
					</Text>
					<Text style={styles.activityAppText} numberOfLines={1}>
						{activityByUserId?.activity_description}
					</Text>
				</View>
			</View>
		</View>
	);
}

export default React.memo(ActivityAppComponent);
