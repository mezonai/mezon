import { ActionEmitEvent, ETypeSearch } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { selectCurrentClanId, selectCurrentClanIsCommunity, selectCurrentClanName, selectMembersClanCount } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../app/componentUI/MezonIconCDN';
import { EventViewer } from '../../../../../../components/Event';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import ClanMenu from '../../ClanMenu/ClanMenu';
import { style } from './styles';

const ChannelListHeader = () => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['clanMenu']);
	const navigation = useNavigation<any>();
	const styles = style(themeValue);
	const members = useSelector(selectMembersClanCount);
	const previousClanName = useRef<string | null>(null);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanName = useSelector(selectCurrentClanName);
	const currentClanClanIsCommunity = useAppSelector(selectCurrentClanIsCommunity);

	useEffect(() => {
		previousClanName.current = currentClanName || '';
	}, [currentClanName]);

	const clanName = !currentClanId || currentClanId === '0' ? previousClanName.current : currentClanName;

	const navigateToSearchPage = async () => {
		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL,
			params: {
				typeSearch: ETypeSearch.SearchAll
			}
		});
	};

	const onOpenScanQR = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
			screen: APP_SCREEN.SETTINGS.QR_SCANNER
		});
	};

	const handlePressEventCreate = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
			screen: APP_SCREEN.MENU_CLAN.CREATE_EVENT,
			params: {
				onGoBack: () => {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				}
			}
		});
	}, [navigation]);

	const onOpenEvent = () => {
		const data = {
			snapPoints: ['50%', '80%'],
			children: <EventViewer handlePressEventCreate={handlePressEventCreate} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	const handlePress = () => {
		const data = {
			heightFitContent: true,
			children: <ClanMenu />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View style={styles.container}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.secondary, themeValue?.primaryGradiant || themeValue.secondary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			{!!clanName && (
				<TouchableOpacity onPressIn={handlePress} style={styles.listHeader}>
					<View style={styles.titleNameWrapper}>
						<Text numberOfLines={1} style={styles.titleServer}>
							{clanName}
						</Text>
						{!!currentClanClanIsCommunity && (
							<MezonIconCDN icon={IconCDN.verifyIcon} width={size.s_18} height={size.s_18} color={baseColor.blurple} />
						)}
					</View>
					<View style={styles.row}>
						<Text numberOfLines={1} style={[styles.subTitle, { color: themeValue.textStrong }]}>
							{`${members} ${t('info.members')}`}
						</Text>
						{currentClanClanIsCommunity && <View style={styles.dot} />}
						{currentClanClanIsCommunity && (
							<Text numberOfLines={1} style={[styles.subTitle, { color: themeValue.textStrong }]}>
								{t('common.community')}
							</Text>
						)}
					</View>
				</TouchableOpacity>
			)}
			<View style={styles.navigationBar}>
				<TouchableOpacity onPressIn={navigateToSearchPage} style={styles.wrapperSearch}>
					<LinearGradient
						start={{ x: 1, y: 0 }}
						end={{ x: 0, y: 0 }}
						colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
						style={[StyleSheet.absoluteFillObject]}
					/>
					<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
					<Text style={styles.placeholderSearchBox}>{t('common.search')}</Text>
				</TouchableOpacity>
				<TouchableOpacity onPressIn={onOpenScanQR} style={styles.iconWrapper}>
					<MezonIconCDN icon={IconCDN.myQRcodeIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
				</TouchableOpacity>
				<TouchableOpacity onPressIn={onOpenEvent} style={styles.iconWrapper}>
					<MezonIconCDN icon={IconCDN.calendarIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default memo(ChannelListHeader);
