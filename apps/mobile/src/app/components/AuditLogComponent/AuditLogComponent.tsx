import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { Icons } from '@mezon/mobile-components';
import { Fonts, size, useTheme } from '@mezon/mobile-ui';
import { auditLogList } from '@mezon/store';
import { RootState, auditLogFilterActions, selectActionAuditLog, selectCurrentClanId, selectUserAuditLog, useAppDispatch } from '@mezon/store-mobile';
import { ActionLog, UserAuditLog } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { MezonapiListAuditLog } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { IMezonMenuSectionProps, MezonBottomSheet, MezonDateTimePicker, MezonMenu } from '../../componentUI';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import { AuditLogItem } from './AuditLogItem/AuditLogItem';
import EmptyAuditLog from './EmptyAuditLog/EmptyAuditLog';
import { style } from './styles';
type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.AUDIT_LOG;

export default function AuditLogComponent({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const [auditLogData, setAuditLogData] = useState<MezonapiListAuditLog>();
	const filterBSRef = useRef(null);
	const { dismiss } = useBottomSheetModal();
	const actionAuditLog = useSelector(selectActionAuditLog);
	const userAuditLog = useSelector(selectUserAuditLog);
	const currentClanId = useSelector(selectCurrentClanId) as string;
	const { t } = useTranslation('auditLog');
	const loadingStatus = useSelector((state: RootState) => state?.auditlog?.loadingStatus);
	const [selectDate, setSelectDate] = useState<Date>(new Date());
	const today = useMemo(() => new Date(), []);

	const formatDate = (date: Date) => {
		const day = String(date?.getDate())?.padStart(2, '0');
		const month = String(date?.getMonth() + 1)?.padStart(2, '0');
		const year = date?.getFullYear();
		return `${day}-${month}-${year}`;
	};

	const styles = style(themeValue);

	const displayUserName = useMemo(() => {
		return userAuditLog?.username && userAuditLog?.username !== UserAuditLog.ALL_USER_AUDIT
			? userAuditLog?.username
			: UserAuditLog.ALL_USER_AUDIT;
	}, [userAuditLog?.username]);

	const displayActionLog = useMemo(() => {
		return actionAuditLog && actionAuditLog !== ActionLog.ALL_ACTION_AUDIT ? actionAuditLog : ActionLog.ALL_ACTION_AUDIT;
	}, [actionAuditLog]);

	useEffect(() => {
		navigation.setOptions({
			headerTitle: t('auditLogComponent.title'),
			headerLeft: () => (
				<TouchableOpacity style={styles.headerLeftBtn} onPress={() => navigation.goBack()}>
					<Icons.ArrowLargeLeftIcon height={Fonts.size.s_20} width={Fonts.size.s_20} color={themeValue.textStrong} />
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity style={styles.headerRightBtn} onPress={handleOnPressFilter}>
					<Text style={styles.headerRightText}>{t('auditLogComponent.filterBtn')}</Text>
				</TouchableOpacity>
			)
		});
	}, []);

	useEffect(() => {
		return () => {
			resetAuditLogOption();
		};
	}, []);

	const fetchAudiLogList = async () => {
		const body = {
			actionLog: actionAuditLog === ActionLog.ALL_ACTION_AUDIT ? '' : actionAuditLog,
			userId: userAuditLog?.userId ?? '',
			clanId: currentClanId ?? '',
			noCache: true,
			date_log: formatDate(selectDate)
		};
		const response = await dispatch(auditLogList(body));
		if (response) {
			setAuditLogData(response?.payload);
		}
	};

	const resetAuditLogOption = () => {
		dispatch(
			auditLogFilterActions.setUser({
				userId: '',
				username: ''
			})
		);
		dispatch(auditLogFilterActions.setAction(null));
	};

	useEffect(() => {
		if (currentClanId) {
			fetchAudiLogList();
		}
	}, [actionAuditLog, userAuditLog, selectDate]);

	const menu = useMemo(
		() =>
			[
				{
					items: [
						{
							title: t('auditLogComponent.filterByUser'),
							onPress: () => {
								navigation.navigate(APP_SCREEN.MENU_CLAN.FILTER_BY_USER);
								dismiss();
							}
						},
						{
							title: t('auditLogComponent.filterByAction'),
							onPress: () => {
								navigation.navigate(APP_SCREEN.MENU_CLAN.FILTER_BY_ACTION);
								dismiss();
							}
						}
					]
				}
			] as IMezonMenuSectionProps[],
		[]
	);
	const handleOnPressFilter = () => {
		filterBSRef?.current?.present();
	};

	const handleDatePicked = useCallback((date) => {
		setSelectDate(date);
		dismiss();
	}, []);

	const renderAditLogItem = ({ item }) => <AuditLogItem data={item} />;
	return (
		<View style={{ paddingVertical: size.s_10, width: '100%', height: '100%', backgroundColor: themeValue.primary }}>
			<TouchableOpacity onPress={handleOnPressFilter} activeOpacity={0.5} style={styles.filterBtn}>
				<View style={{ gap: size.s_10, alignItems: 'center', flexDirection: 'row', marginRight: size.s_10 }}>
					<View
						style={{
							maxWidth: 200,
							marginLeft: size.s_20,
							backgroundColor: themeValue.tertiary,
							padding: size.s_6,
							borderRadius: size.s_6
						}}
					>
						<Text style={styles.textFilterBtn} numberOfLines={1}>
							{displayUserName}
						</Text>
					</View>
					<View style={{ maxWidth: 200, backgroundColor: themeValue.tertiary, padding: size.s_6, borderRadius: size.s_6 }}>
						<Text style={styles.textFilterBtn} numberOfLines={1}>
							{displayActionLog}
						</Text>
					</View>
					<Icons.ChevronSmallRightIcon width={size.s_18} height={size.s_18} color={themeValue.text} />
				</View>
			</TouchableOpacity>
			<View style={{ paddingHorizontal: size.s_10 }}>
				<MezonDateTimePicker
					value={selectDate}
					onChange={handleDatePicked}
					mode={'date'}
					maximumDate={today}
					containerStyle={styles.stylesDatePicker}
				/>
			</View>

			<View style={{ flex: 1, paddingHorizontal: size.s_10, paddingVertical: size.s_10 }}>
				{loadingStatus === 'loaded' && !auditLogData?.logs?.length ? (
					<EmptyAuditLog />
				) : (
					<FlashList
						showsVerticalScrollIndicator={false}
						data={auditLogData?.logs}
						renderItem={renderAditLogItem}
						removeClippedSubviews={true}
						keyExtractor={(item) => item?.id?.toString()}
						estimatedItemSize={size.s_50}
					/>
				)}
			</View>
			<MezonBottomSheet snapPoints={['20%']} ref={filterBSRef}>
				<View style={{ paddingHorizontal: size.s_20 }}>
					<MezonMenu menu={menu} />
				</View>
			</MezonBottomSheet>
		</View>
	);
}
