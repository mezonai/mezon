import { size, useTheme } from '@mezon/mobile-ui';
import type { ApiChannelAppResponse } from 'mezon-js/types';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../../../components/ImageNative';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from './styles';

const ItemChannelAppListing = ({
	item,
	openChannelApp
}: {
	item: ApiChannelAppResponse;
	openChannelApp: (channel: ApiChannelAppResponse) => void;
}) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<TouchableOpacity style={styles.itemContainer} onPress={() => openChannelApp(item)}>
			<View style={styles.itemLogo}>
				{item?.app_logo ? (
					<View style={styles.itemIcon}>
						<ImageNative url={item?.app_logo} style={styles.itemIconImg} resizeMode={'contain'} />
					</View>
				) : (
					<View style={[styles.itemIcon, styles.itemLogoBorder]}>
						<MezonIconCDN icon={IconCDN.channelApp} width={size.s_30} height={size.s_30} color={themeValue.textDisabled} />
					</View>
				)}
			</View>

			{!!item?.app_name && (
				<Text style={styles.itemName} numberOfLines={1}>
					{item?.app_name || ''}
				</Text>
			)}
		</TouchableOpacity>
	);
};

export default memo(ItemChannelAppListing);
