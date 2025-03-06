import { useTheme } from '@mezon/mobile-ui';
import { selectBadgeCountByClanId, selectCurrentClanId } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ImageNative from '../../../../../components/ImageNative';
import { style } from './styles';

interface IClanIconProps {
	data: any;
	onPress?: any;
}
export const ClanIcon = memo(
	(props: IClanIconProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const currentClanId = useSelector(selectCurrentClanId);
		const badgeCountClan = useSelector(selectBadgeCountByClanId(props?.data?.clan_id ?? '')) || 0;

		const isActive = currentClanId === props?.data?.clan_id;
		return (
			<Pressable
				style={[styles.wrapperClanIcon]}
				onPress={() => {
					if (props?.onPress && props?.data?.clan_id) {
						props?.onPress(props?.data?.clan_id);
					}
				}}
			>
				{props?.data?.logo ? (
					<View style={[styles.logoClan, isActive && styles.logoClanActive]}>
						<ImageNative
							url={createImgproxyUrl(props?.data?.logo ?? '', { width: 100, height: 100, resizeType: 'fit' })}
							style={{ width: '100%', height: '100%' }}
							resizeMode={'cover'}
						/>
					</View>
				) : (
					<View style={[styles.clanIcon, isActive && styles.logoClanActive]}>
						<Text style={styles.textLogoClanIcon}>{props?.data?.clan_name?.charAt(0)?.toUpperCase()}</Text>
					</View>
				)}

				{badgeCountClan > 0 && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{badgeCountClan > 99 ? `+99` : badgeCountClan}</Text>
					</View>
				)}
				{!!isActive && <View style={styles.lineActiveClan} />}
			</Pressable>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.data?.clan_id === nextProps.data?.clan_id;
	}
);
