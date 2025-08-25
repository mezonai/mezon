import { size, useTheme } from '@mezon/mobile-ui';
import { ClanGroup as ClanGroupType, clansActions, useAppDispatch } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import React, { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { ClanIcon } from '../../screens/home/homedrawer/components/ClanIcon';
import ImageNative from '../ImageNative';
import { style } from './styles';

interface ClanGroupProps {
	group: ClanGroupType;
	onClanPress: (clanId: string) => void;
	clans: any[];
	drag: () => void;
	isActive?: boolean;
}

export const ClanGroup = memo(({ group, onClanPress, clans, drag, isActive }: ClanGroupProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const groupClan = useMemo(() => {
		if (!group?.clanIds?.length || !clans?.length) return [];
		try {
			return clans.filter((clan) => group.clanIds.includes(clan?.clan_id));
		} catch (error) {
			console.error('Error in groupClan: ', error);
			return [];
		}
	}, [clans, group?.clanIds]);

	const totalBadgeCount = useMemo(() => {
		if (!groupClan?.length) return 0;

		try {
			return groupClan.reduce((total, clan) => {
				return total + (clan?.badge_count || 0);
			}, 0);
		} catch (error) {
			console.error('Error in totalBadgeCount: ', error);
			return 0;
		}
	}, [groupClan]);

	const handleRemoveClanFromGroup = (clanId: string) => {
		if (group?.id && clanId) {
			dispatch(clansActions.removeClanFromGroup({ groupId: group.id, clanId }));
		}
	};

	const handleToggleGroup = () => {
		if (group?.id) {
			dispatch(clansActions.toggleGroupExpanded(group.id));
		}
	};

	if (!groupClan?.length) {
		return null;
	}

	const renderClanContent = (clan: any) => {
		return (
			<View>
				{clan?.logo ? (
					<View style={{ overflow: 'hidden', borderRadius: 10 }}>
						<ImageNative
							url={createImgproxyUrl(clan?.logo, { width: 100, height: 100, resizeType: 'fit' })}
							style={{ width: '100%', height: '100%' }}
							resizeMode="cover"
						/>
					</View>
				) : (
					<View style={styles.clanIcon}>
						<Text style={styles.clanIconText}>{clan?.clan_name?.charAt(0)?.toUpperCase()}</Text>
					</View>
				)}
			</View>
		);
	};

	if (group?.isExpanded) {
		return (
			<View style={styles.expandedGroup}>
				<TouchableOpacity style={styles.groupHeader} onPress={handleToggleGroup}>
					<MezonIconCDN icon={IconCDN.forderIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				</TouchableOpacity>

				{groupClan?.map((clan) => (
					<View key={`${clan?.clan_id}-expanded-container`} style={styles.clanContainer}>
						<ClanIcon key={`${clan?.clan_id}-expanded`} data={clan} onPress={onClanPress} drag={undefined} isActive={false} />
						<TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveClanFromGroup(clan?.clan_id)}>
							<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_16} height={size.s_16} color={themeValue.textStrong} />
						</TouchableOpacity>
					</View>
				))}
			</View>
		);
	}

	return (
		<ScaleDecorator activeScale={1.5}>
			<TouchableOpacity style={styles.collapsedGroup} onPress={handleToggleGroup} onLongPress={drag} disabled={isActive}>
				<View style={styles.groupIcon}>
					<View style={[styles.multipleClansView, groupClan.length === 1 && styles.singleClanView]}>
						{groupClan?.slice(0, 4)?.map((clan) => (
							<View key={`${clan?.clan_id}-collapsed`} style={styles.quarterClan}>
								{renderClanContent(clan)}
							</View>
						))}
					</View>
					{totalBadgeCount > 0 && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{totalBadgeCount > 99 ? '99+' : totalBadgeCount}</Text>
						</View>
					)}
				</View>
			</TouchableOpacity>
		</ScaleDecorator>
	);
});
