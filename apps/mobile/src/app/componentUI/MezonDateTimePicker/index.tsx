import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { getNearTime } from '@mezon/mobile-components';
import { Colors, ThemeModeBase, size, useTheme } from '@mezon/mobile-ui';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { TouchableOpacity } from 'react-native-gesture-handler';
import MezonBottomSheet from '../MezonBottomSheet';
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
	...props
}: IMezonDateTimePicker) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const bottomSheetRef = useRef<BottomSheetModalMethods>();
	const [date, setDate] = useState(value || getNearTime(120));
	const isModeTime = useMemo(() => mode === 'time', [mode]);
	const [currentDate, setCurrentDate] = useState(value || getNearTime(120));

	useEffect(() => {
		setDate(value || getNearTime(120));
		setCurrentDate(value || getNearTime(120));
	}, [value]);
	const handleChange = useCallback(() => {
		if (keepTime && !isModeTime && value) {
			const new_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), value.getHours(), value.getMinutes(), value.getSeconds());
			setCurrentDate(new_date);
			onChange && onChange(new_date);
		} else {
			setCurrentDate(date);
			onChange && onChange(date);
		}
	}, [keepTime, mode, value, date, error]);

	useEffect(() => {
		if (!error) {
			handleClose();
		}
	}, [error, value]);

	function handleClose() {
		bottomSheetRef?.current?.dismiss();
	}

	function handlePress() {
		bottomSheetRef?.current?.present();
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

			<MezonBottomSheet
				ref={bottomSheetRef}
				heightFitContent
				title={props.title}
				headerRight={
					<TouchableOpacity style={styles.btnHeaderBS} onPress={handleChange}>
						<Text style={styles.textApply}>Apply</Text>
					</TouchableOpacity>
				}
			>
				{error && (
					<View style={{ backgroundColor: Colors.textRed, marginHorizontal: size.s_20, padding: size.s_10, borderRadius: size.s_8 }}>
						<Text style={styles.textError}>{error}</Text>
						<Text style={styles.textError}>{formatDate(new Date())}</Text>
					</View>
				)}
				<View style={styles.bsContainer}>
					<DatePicker
						{...(need24HourFormat && isModeTime ? need24HourFormat : {})}
						{...(needLocale && isModeTime ? needLocale : {})}
						date={date}
						onDateChange={setDate}
						mode={mode}
						theme={themeBasic === ThemeModeBase.DARK ? 'dark' : 'light'}
						{...(maximumDate ? { maximumDate } : {})}
					/>
				</View>
			</MezonBottomSheet>
		</View>
	);
});
