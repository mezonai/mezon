import { size, useTheme } from '@mezon/mobile-ui';
import { selectAppChannelsList } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import type { ApiChannelAppResponse } from 'mezon-js/types';
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { style } from './styles';

const ChannelAppShowAll = ({ navigation }: { navigation: any }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const allChannelApp = useSelector(selectAppChannelsList);
	const nav = useNavigation<any>();

	const handleClose = () => navigation.goBack();

	const openChannelApp = useCallback(
		async (channel: ApiChannelAppResponse) => {
			nav.navigate(APP_SCREEN.CHANNEL_APP, {
				channelId: channel.channelId,
				clanId: channel.clanId
			});
		},
		[nav]
	);

	const renderAppItem = useCallback(
		({ item }: { item: ApiChannelAppResponse }) => {
			return (
				<TouchableOpacity style={styles.appItemContainer} onPress={() => openChannelApp(item)} activeOpacity={0.7}>
					<View style={styles.appItemContent}>
						<View style={styles.appItemLogo}>
							{item?.app_logo ? (
								<FastImage source={{ uri: item?.app_logo }} style={styles.appItemIcon} resizeMode={FastImage.resizeMode.contain} />
							) : (
								<View style={[styles.appItemIcon, styles.appItemIconPlaceholder]}>
									<MezonIconCDN icon={IconCDN.channelApp} width={size.s_32} height={size.s_32} color={themeValue.textDisabled} />
								</View>
							)}
						</View>
						<View style={styles.appItemInfo}>
							<Text style={styles.appItemName} numberOfLines={1}>
								{item?.app_name || ''}
							</Text>
							{/*<Text style={styles.appItemDescription} numberOfLines={2}></Text>*/}
						</View>
					</View>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={size.s_20} width={size.s_20} color={themeValue.textDisabled} />
				</TouchableOpacity>
			);
		},
		[openChannelApp, styles, themeValue]
	);

	const renderEmptyState = useCallback(() => {
		return (
			<View style={styles.emptyStateContainer}>
				<MezonIconCDN icon={IconCDN.channelApp} width={size.s_60} height={size.s_60} color={themeValue.textDisabled} />
				<Text style={styles.emptyStateText}>No channel apps available</Text>
			</View>
		);
	}, [styles, themeValue]);

	return (
		<View style={styles.containerAll}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.secondary, themeValue?.primaryGradiant || themeValue.secondary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={handleClose}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
				</TouchableOpacity>
				<Text style={styles.title}>
					<Text style={styles.mezonBold}>Mezon</Text>
					<Text style={styles.subtitle}> Channel apps</Text>
				</Text>
			</View>
			<FlatList
				data={allChannelApp}
				renderItem={renderAppItem}
				keyExtractor={(item) => item.channelId}
				contentContainerStyle={styles.appListContent}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={renderEmptyState}
				ItemSeparatorComponent={() => <View style={styles.appItemSeparator} />}
			/>
		</View>
	);
};

export default ChannelAppShowAll;
