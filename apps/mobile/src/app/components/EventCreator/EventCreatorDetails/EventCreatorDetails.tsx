import { ActionEmitEvent, getDayName, getDayWeekName, getDayYearName, getNearTime } from '@mezon/mobile-components';
import { Fonts, size, useTheme } from '@mezon/mobile-ui';
import { ERepeatType, MAX_FILE_SIZE_1MB, OptionEvent } from '@mezon/utils';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MezonButton, { EMezonButtonTheme } from '../../../componentUI/MezonButton';
import MezonDateTimePicker from '../../../componentUI/MezonDateTimePicker';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonImagePicker from '../../../componentUI/MezonImagePicker';
import MezonInput from '../../../componentUI/MezonInput';
import MezonSelect from '../../../componentUI/MezonSelect';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type CreateEventScreenDetails = typeof APP_SCREEN.MENU_CLAN.CREATE_EVENT_DETAILS;
export function EventCreatorDetails({ navigation, route }: MenuClanScreenProps<CreateEventScreenDetails>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t, i18n } = useTranslation(['eventCreator']);
	const { type, channelId, location, eventChannelId, isPrivate, onGoBack, currentEvent } = route.params || {};

	const language = useMemo(() => (i18n.language === 'vi' ? 'vi' : 'en'), [i18n]);
	const today = new Date();

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: t('screens.eventDetails.headerTitle'),
			headerTitleStyle: {
				fontSize: Fonts.size.h7,
				color: themeValue.textDisabled
			},
			headerLeft: () => (
				<TouchableOpacity style={{ marginLeft: 20 }} onPress={() => navigation.goBack()}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity
					style={{ marginRight: 20 }}
					onPress={() => {
						onGoBack?.();
						navigation.navigate(APP_SCREEN.HOME);
					}}
				>
					<MezonIconCDN icon={IconCDN.closeLargeIcon} height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
				</TouchableOpacity>
			)
		});
	}, [navigation, onGoBack, t, themeValue.textDisabled, themeValue.textStrong]);

	const currentStartDate = currentEvent?.start_time ? new Date(currentEvent?.start_time) : undefined;
	const currentEndDate = currentEvent?.end_time ? new Date(currentEvent?.end_time) : undefined;

	const [eventTitle, setEventTitle] = useState<string>(currentEvent?.title || '');
	const [eventDescription, setEventDescription] = useState<string>(currentEvent?.description || '');
	const [startTime, setStartTime] = useState<Date>(currentStartDate || getNearTime(120));
	const [startDate, setStartDate] = useState<Date>(currentStartDate || getNearTime(120));
	const [combinedStartDateTime, setCombinedStartDateTime] = useState(new Date());
	const [combinedEndDateTime, setCombinedEndDateTime] = useState(new Date());
	const [endDate, setEndDate] = useState<Date>(currentEndDate || getNearTime(240));
	const [endTime, setEndTime] = useState<Date>(currentEndDate || getNearTime(240));
	const [eventFrequency, setEventFrequency] = useState<number>(currentEvent?.repeat_type || 0);
	const [eventLogo, setEventLogo] = useState<string>(currentEvent?.logo || '');
	const [isValidEventTitle, setIsValidEventTitle] = useState<boolean>(true);

	const options = useMemo(
		() => [
			{
				title: t('fields.eventFrequency.noRepeat'),
				value: ERepeatType.DOES_NOT_REPEAT
			},
			{
				title: t('fields.eventFrequency.weeklyOn', { name: getDayName(combinedStartDateTime, language) }),
				value: ERepeatType.WEEKLY_ON_DAY
			},
			{
				title: t('fields.eventFrequency.everyOther', { name: getDayName(combinedStartDateTime, language) }),
				value: ERepeatType.EVERY_OTHER_DAY
			},
			{
				title: t('fields.eventFrequency.monthlyOn', { name: getDayWeekName(combinedStartDateTime, language) }),
				value: ERepeatType.MONTHLY
			},
			{
				title: t('fields.eventFrequency.annuallyOn', { name: getDayYearName(combinedStartDateTime, language) }),
				value: ERepeatType.ANNUALLY
			},
			{
				title: t('fields.eventFrequency.everyWeekday'),
				value: ERepeatType.WEEKLY_ON_DAY
			}
		],
		[combinedStartDateTime]
	);

	function handleFrequencyChange(value: number) {
		setEventFrequency(value);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	}

	const isErrorStartDate = useMemo(() => {
		return startDate.getTime() <= today.getTime();
	}, [startDate, today]);

	const isErrorStartTime = useMemo(() => {
		return startTime.getTime() <= today.getTime();
	}, [startTime, today]);

	const isErrorEndDate = useMemo(() => {
		return startDate.getTime() >= endDate.getTime();
	}, [endDate, startDate]);

	const isErrorEndTime = useMemo(() => {
		return startDate.getDate() >= endDate.getDate() && startTime.getTime() >= endTime.getTime();
	}, [endDate, endTime, startDate, startTime]);

	function handlePressNext() {
		setIsValidEventTitle(!!eventTitle?.trim()?.length);
		const isValidTitle = Boolean(eventTitle?.trim());
		const isFormValid =
			isValidTitle && !isErrorStartDate && !isErrorStartTime && (type !== OptionEvent.OPTION_LOCATION || (!isErrorEndDate && !isErrorEndTime));

		if (!isFormValid) {
			return;
		}
		navigation.navigate(APP_SCREEN.MENU_CLAN.CREATE_EVENT_PREVIEW, {
			type,
			channelId,
			location,
			title: eventTitle,
			description: eventDescription,
			startTime: combinedStartDateTime,
			endTime: combinedEndDateTime,
			frequency: eventFrequency,
			eventChannelId: eventChannelId,
			isPrivate: isPrivate,
			logo: eventLogo,
			onGoBack,
			currentEvent: currentEvent
		});
	}

	const combineDateAndTime = (date, time) => {
		const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());
		return combined;
	};

	useEffect(() => {
		const newStartDateTime = combineDateAndTime(startDate, startTime);
		const newEndDateTime = combineDateAndTime(endDate, endTime);
		if (newStartDateTime) {
			setCombinedStartDateTime(newStartDateTime);
		}
		if (newEndDateTime) {
			setCombinedEndDateTime(newEndDateTime);
		}
	}, [startDate, startTime, endDate, endTime]);

	const handleLoad = useCallback((url: string) => {
		setEventLogo(url);
	}, []);

	const handleEventTitle = useCallback((value: string) => {
		setEventTitle(value);
		setIsValidEventTitle(true);
	}, []);
	return (
		<View style={styles.container}>
			<View style={styles.feedSection}>
				<ScrollView showsVerticalScrollIndicator={false}>
					<View style={styles.headerSection}>
						<Text style={styles.title}>{t('screens.eventDetails.title')}</Text>
						<Text style={styles.subtitle}>{t('screens.eventDetails.subtitle')}</Text>
					</View>

					<View style={styles.section}>
						<MezonInput
							label={t('fields.eventName.title')}
							titleUppercase
							value={eventTitle}
							onTextChange={handleEventTitle}
							placeHolder={t('fields.eventName.placeholder')}
							isValid={isValidEventTitle}
							errorMessage={t('fields.eventName.errorMessage')}
						/>
						<View style={styles.inlineSec}>
							<View style={{ flex: 2 }}>
								<MezonDateTimePicker
									title={t('fields.startDate.title')}
									titleUppercase
									onChange={setStartDate}
									value={startDate}
									keepTime
									error={isErrorStartDate ? t('fields.startDate.errorMessage') : ''}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<MezonDateTimePicker
									title={t('fields.startTime.title')}
									titleUppercase
									mode="time"
									onChange={setStartTime}
									value={startTime}
									need24HourFormat={{ is24hourSource: 'locale' }}
									needLocale={{ locale: 'vi' }}
									error={isErrorStartTime ? t('fields.startTime.errorMessage') : ''}
								/>
							</View>
						</View>
						<View style={styles.inlineSec}>
							<View style={{ flex: 2 }}>
								<MezonDateTimePicker
									title={t('fields.endDate.title')}
									titleUppercase
									onChange={setEndDate}
									value={endDate}
									keepTime
									error={isErrorEndDate ? t('fields.endDate.errorMessage') : ''}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<MezonDateTimePicker
									title={t('fields.endTime.title')}
									titleUppercase
									mode="time"
									onChange={setEndTime}
									value={endTime}
									need24HourFormat={{ is24hourSource: 'locale' }}
									needLocale={{ locale: 'vi' }}
									error={isErrorEndTime ? t('fields.endTime.errorMessage') : ''}
								/>
							</View>
						</View>
						<MezonInput
							label={t('fields.description.title')}
							value={eventDescription}
							titleUppercase
							onTextChange={setEventDescription}
							textarea
							placeHolder={t('fields.description.description')}
						/>
						<MezonSelect
							title={t('fields.eventFrequency.title')}
							titleUppercase
							data={options}
							onChange={handleFrequencyChange}
							initValue={eventFrequency}
						/>
						<Text style={styles.label}>{t('fields.cover')}</Text>
						<View style={{ alignSelf: 'center' }}>
							<MezonImagePicker
								defaultValue={eventLogo}
								height={size.s_100 * 2}
								width={size.s_100 * 2}
								onLoad={handleLoad}
								showHelpText
								autoUpload
								imageSizeLimit={MAX_FILE_SIZE_1MB}
								imageHeight={400}
								imageWidth={400}
							/>
						</View>
					</View>
				</ScrollView>
			</View>

			<View style={styles.btnWrapper}>
				<MezonButton
					title={t('actions.next')}
					titleStyle={styles.titleMezonBtn}
					type={EMezonButtonTheme.SUCCESS}
					containerStyle={styles.mezonBtn}
					onPress={handlePressNext}
				/>
			</View>
		</View>
	);
}
