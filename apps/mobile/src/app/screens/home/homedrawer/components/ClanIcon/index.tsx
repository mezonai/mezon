import { useTheme } from '@mezon/mobile-ui';
import { ClansEntity, selectBadgeCountByClanId, selectClanHasUnreadMessage, selectCurrentClanId } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useSelector } from 'react-redux';
import ImageNative from '../../../../../components/ImageNative';
import { style } from './styles';

interface IClanIconProps {
	data: ClansEntity;
	onPress?: any;
	drag: () => void;
	isActive?: boolean;
	onLayout?: (dimensions: { width: number; height: number }) => void;
	hideActive?: boolean;
}

export const ClanIcon = memo(
	(props: IClanIconProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const currentClanId = useSelector(selectCurrentClanId);
		const badgeCountClan = useSelector(selectBadgeCountByClanId(props?.data?.clan_id ?? '')) || 0;
		const isHaveUnreadMessage = useSelector(selectClanHasUnreadMessage(props?.data?.clan_id ?? '')) || false;

		const isActiveCurrentClan = currentClanId === props?.data?.clan_id && !props.hideActive;
		const onIconLayout = useCallback(
			(event: any) => {
				const { width, height } = event.nativeEvent.layout;
				props.onLayout && props.onLayout({ width, height });
			},
			[props.onLayout]
		);
		return (
			<ScaleDecorator activeScale={1.5}>
				<TouchableOpacity
					style={[styles.wrapperClanIcon]}
					onPress={() => {
						if (props?.onPress && props?.data?.clan_id) {
							props?.onPress(props?.data?.clan_id);
						}
					}}
					disabled={props.isActive}
					onLongPress={props.drag}
				>
					<View onLayout={onIconLayout}>
						{props?.data?.logo ? (
							<View style={[styles.logoClan, isActiveCurrentClan && styles.logoClanActive]}>
								<ImageNative
									url={createImgproxyUrl(props?.data?.logo ?? '', { width: 100, height: 100, resizeType: 'fit' })}
									style={styles.imageFullSize}
									resizeMode={'cover'}
								/>
							</View>
						) : (
							<View style={[styles.clanIcon, isActiveCurrentClan && styles.logoClanActive]}>
								<Text style={styles.textLogoClanIcon}>{props?.data?.clan_name?.charAt(0)?.toUpperCase()}</Text>
							</View>
						)}
					</View>

					{badgeCountClan > 0 && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{badgeCountClan > 99 ? `+99` : badgeCountClan}</Text>
						</View>
					)}
					{isHaveUnreadMessage && <View style={styles.unreadDot} />}
					{!!isActiveCurrentClan && <View style={styles.lineActiveClan} />}
				</TouchableOpacity>
			</ScaleDecorator>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.data?.clan_id === nextProps.data?.clan_id &&
			prevProps.data?.logo === nextProps.data?.logo &&
			prevProps.data?.clan_name === nextProps.data?.clan_name &&
			prevProps.data?.has_unread_message === nextProps.data?.has_unread_message &&
			prevProps.isActive === nextProps.isActive
		);
	}
);
