import { ActionEmitEvent, getNearTime } from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, StyleProp, Text, View, ViewStyle } from 'react-native';
import MezonFakeInputBox, { IMezonFakeBoxProps } from '../MezonFakeBox';
import { style } from './styles';

type IMezonDateTimePicker = Omit<IMezonFakeBoxProps, 'onPress' | 'postfixIcon' | 'value'> & {
	mode?: 'datetime' | 'date' | 'time';
	onChange?: (time: Date) => void;
	value?: Date;
	keepTime?: boolean;
	need24HourFormat?: { is24hourSource: 'locale' | 'device' };
	needLocale?: { locale: string };
	error?: string;
	containerStyle?: StyleProp<ViewStyle>;
	maximumDate?: Date;
	display?: string;
};

export default memo(function MezonDateTimePicker({
	mode = 'date',
	onChange,
	value,
	keepTime,
	need24HourFormat,
	needLocale,
	error,
	containerStyle,
	maximumDate,
	display,
	...props
}: IMezonDateTimePicker) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const isModeTime = useMemo(() => mode === 'time', [mode]);
	const [currentDate, setCurrentDate] = useState(value || getNearTime(120));
	const [show, setShow] = useState(false);
	const dateRef = useRef(value || getNearTime(120));

	useEffect(() => {
		dateRef.current = value || getNearTime(120);
		setCurrentDate(value || getNearTime(120));
	}, [value]);
	const handleChange = useCallback(() => {
		if (keepTime && !isModeTime && value) {
			const newDate = new Date(
				dateRef.current.getFullYear(),
				dateRef.current.getMonth(),
				dateRef.current.getDate(),
				value.getHours(),
				value.getMinutes(),
				value.getSeconds()
			);
			setCurrentDate(newDate);
			onChange && onChange(newDate);
		} else {
			setCurrentDate(dateRef.current);
			onChange && onChange(dateRef.current);
		}
	}, [dateRef.current, keepTime, isModeTime, value, onChange]);

	useEffect(() => {
		if (!error) {
			handleClose();
		}
	}, [error, value]);

	function handleClose() {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	}

	const ContentBottomSheet = () => {
		const onChange = (event, selectedDate) => {
			if (event.type === 'dismissed') {
				setShow(false);
			}

			if (event.type === 'neutralButtonPressed') {
				setShow(false);
			} else {
				dateRef.current = selectedDate;
				handleChange();
				setShow(false);
			}
		};

		return (
			<View>
				{error && (
					<View style={styles.wrapperError}>
						<Text style={styles.textError}>{error}</Text>
						<Text style={styles.textError}>{formatDate(new Date())}</Text>
					</View>
				)}
				{show && (
					<View style={styles.bsContainer}>
						<DateTimePicker
							{...(need24HourFormat && isModeTime ? need24HourFormat : {})}
							{...(needLocale && isModeTime ? needLocale : {})}
							value={dateRef?.current || new Date()}
							display={isModeTime ? 'spinner' : display ? display : 'default'}
							is24Hour
							onChange={onChange}
							mode={mode}
							themeVariant={themeBasic === ThemeModeBase.DARK ? 'dark' : 'light'}
							{...(maximumDate ? { maximumDate } : {})}
							// style={{ backgroundColor: themeValue.primary }}
							textColor={themeValue.textStrong}
						/>
					</View>
				)}
			</View>
		);
	};

	function handlePress() {
		setShow(true);
	}

	const formatDate = (date) => {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const formatCurrentDateTime = (currentDate, isModeTime, need24HourFormat) => {
		const day = String(currentDate.getDate()).padStart(2, '0');
		const month = String(currentDate.getMonth() + 1).padStart(2, '0');
		const year = currentDate.getFullYear();
		const hours = currentDate.getHours();
		const minutes = String(currentDate.getMinutes()).padStart(2, '0');

		if (isModeTime) {
			if (need24HourFormat) {
				return `${String(hours).padStart(2, '0')}:${minutes}`;
			} else {
				const period = hours >= 12 ? 'PM' : 'AM';
				const hours12 = hours % 12 || 12;
				return `${hours12}:${minutes} ${period}`;
			}
		} else {
			return `${day}/${month}/${year}`;
		}
	};

	return (
		<View>
			<MezonFakeInputBox
				{...props}
				value={formatCurrentDateTime(currentDate, isModeTime, need24HourFormat)}
				containerStyle={containerStyle}
				onPress={handlePress}
			/>
			<ContentBottomSheet />
		</View>
	);
});
