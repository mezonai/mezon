import { getDayName, getDayWeekName, getDayYearName, getNearTime, Icons } from '@mezon/mobile-components';
import { Fonts, useTheme } from '@mezon/mobile-ui';
import { OptionEvent } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MezonButton, { EMezonButtonTheme } from '../../../componentUI/MezonButton2';
import MezonDateTimePicker from '../../../componentUI/MezonDateTimePicker';
import MezonInput from '../../../componentUI/MezonInput';
import MezonSelect from '../../../componentUI/MezonSelect';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { ErrorInput } from '../../ErrorInput';
import { style } from './styles';

type CreateEventScreenDetails = typeof APP_SCREEN.MENU_CLAN.CREATE_EVENT_DETAILS;
export function EventCreatorDetails({ navigation, route }: MenuClanScreenProps<CreateEventScreenDetails>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t, i18n } = useTranslation(['eventCreator']);
	const { type, channelId, location, eventChannelId, onGoBack } = route.params || {};

	const language = useMemo(() => (i18n.language === 'vi' ? 'vi' : 'en'), [i18n]);
	const today = new Date();

	navigation.setOptions({
		headerTitle: t('screens.eventDetails.headerTitle'),
		headerTitleStyle: {
			fontSize: Fonts.size.h7,
			color: themeValue.textDisabled
		},
		headerLeft: () => (
			<TouchableOpacity style={{ marginLeft: 20 }} onPress={() => navigation.goBack()}>
				<Icons.ArrowLargeLeftIcon height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
			</TouchableOpacity>
		),
		headerRight: () => (
			<TouchableOpacity style={{ marginRight: 20 }} onPress={handleClose}>
				<Icons.CloseLargeIcon height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
			</TouchableOpacity>
		)
	});

	function handleClose() {
		onGoBack?.();
		navigation.navigate(APP_SCREEN.HOME);
	}

	const [eventTitle, setEventTitle] = useState<string>('');
	const [eventDescription, setEventDescription] = useState<string>('');
	const [startTime, setStartTime] = useState<Date>(getNearTime(120));
	const [startDate, setStartDate] = useState<Date>(getNearTime(120));
	const [combinedStartDateTime, setCombinedStartDateTime] = useState(new Date());
	const [combinedEndDateTime, setCombinedEndDateTime] = useState(new Date());
	const [endDate, setEndDate] = useState<Date>(getNearTime(240));
	const [endTime, setEndTime] = useState<Date>(getNearTime(240));
	const [eventFrequency, setEventFrequency] = useState<number>(0);
	const [isValidEventTitle, setIsValidEventTitle] = useState<boolean>(true);

	const options = useMemo(
		() => [
			{
				title: t('fields.eventFrequency.noRepeat'),
				value: 0
			},
			{
				title: t('fields.eventFrequency.weeklyOn', { name: getDayName(combinedStartDateTime, language) }),
				value: 1
			},
			{
				title: t('fields.eventFrequency.everyOther', { name: getDayName(combinedStartDateTime, language) }),
				value: 2
			},
			{
				title: t('fields.eventFrequency.monthlyOn', { name: getDayWeekName(combinedStartDateTime, language) }),
				value: 3
			},
			{
				title: t('fields.eventFrequency.annuallyOn', { name: getDayYearName(combinedStartDateTime, language) }),
				value: 4
			},
			{
				title: t('fields.eventFrequency.everyWeekday'),
				value: 5
			}
		],
		[combinedStartDateTime]
	);

	function handleFrequencyChange(value: number) {
		setEventFrequency(value);
	}

	const isErrorStartDate = useMemo(() => {
		return startDate.getTime() <= today.getTime();
	}, [startDate]);

	const isErrorStartTime = useMemo(() => {
		return startTime.getTime() <= today.getTime();
	}, [startTime]);

	const isErrorEndDate = useMemo(() => {
		return startDate.getTime() >= endDate.getTime();
	}, [endDate]);

	const isErrorEndTime = useMemo(() => {
		return startTime.getTime() >= endTime.getTime();
	}, [endTime]);

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
			onGoBack: onGoBack
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

	const handleEventTitle = useCallback((value: string) => {
		setEventTitle(value);
		setIsValidEventTitle(true);
	}, []);
	return (
		<View style={styles.container}>
			<View style={styles.feedSection}>
				<ScrollView>
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

						{type === OptionEvent.OPTION_LOCATION && (
							<View style={styles.inlineSec}>
								<View style={{ flex: 2 }}>
									<MezonDateTimePicker
										title={t('fields.endDate.title')}
										onChange={setEndDate}
										value={endDate}
										keepTime
										error={isErrorEndDate ? t('fields.endDate.errorMessage') : ''}
									/>
								</View>
								<View style={{ flex: 1 }}>
									<MezonDateTimePicker
										title={t('fields.endTime.title')}
										mode="time"
										onChange={setEndTime}
										value={endTime}
										need24HourFormat={{ is24hourSource: 'locale' }}
										needLocale={{ locale: 'vi' }}
										error={isErrorEndTime ? t('fields.endTime.errorMessage') : ''}
									/>
								</View>
							</View>
						)}

						<MezonInput
							label={t('fields.description.title')}
							value={eventDescription}
							titleUppercase
							onTextChange={setEventDescription}
							textarea
							placeHolder={t('fields.description.description')}
						/>

						<MezonSelect title={t('fields.eventFrequency.title')} titleUppercase data={options} onChange={handleFrequencyChange} />
					</View>
				</ScrollView>
			</View>

			<View style={styles.btnWrapper}>
				{isValidEventTitle ? null : (
					<ErrorInput isShowIcon={false} textErrorStyle={{ fontStyle: 'normal' }} errorMessage={'An event topic is required'} />
				)}
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
