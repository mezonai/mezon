import { size, useTheme } from '@mezon/mobile-ui';
import { DirectEntity } from '@mezon/store-mobile';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import ImageNative from '../ImageNative';
import style from './DMGroupItem.styles';

interface IDMGroupItemProps {
	dmGroupData: DirectEntity;
	navigateToDirectMessage: () => void;
}

export const DMGroupItem = memo(({ dmGroupData, navigateToDirectMessage }: IDMGroupItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const dmLabel = useMemo(() => {
		return (dmGroupData?.channelLabel ||
			(typeof dmGroupData?.usernames === 'string' ? dmGroupData?.usernames : dmGroupData?.usernames?.[0] || '')) as string;
	}, [dmGroupData?.channelLabel, dmGroupData?.usernames]);

	const dmAvatar = useMemo(() => {
		return dmGroupData?.channel_avatar;
	}, [dmGroupData?.channel_avatar]);

	const renderAvatar = useCallback(() => {
		if (dmAvatar && !dmAvatar.includes('avatar-group.png')) {
			return (
				<View style={styles.avatar}>
					<ImageNative url={dmAvatar} style={styles.avatar} />
				</View>
			);
		}
		return (
			<View style={styles.defaultAvatar}>
				<MezonIconCDN icon={IconCDN.groupIcon} width={size.s_20} height={size.s_20} />
			</View>
		);
	}, [dmAvatar, styles]);

	return (
		<TouchableOpacity activeOpacity={0.7} onPress={navigateToDirectMessage} style={styles.container}>
			<View style={styles.leftContent}>
				{renderAvatar()}
				<View style={styles.textContent}>
					<Text style={styles.groupName} numberOfLines={1}>
						{dmLabel}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
});
