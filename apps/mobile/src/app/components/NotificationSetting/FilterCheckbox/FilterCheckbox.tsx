import { IOptionsNotification } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ENotificationTypes } from '@mezon/utils';
import React from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MezonRadioButton from '../../../componentUI/MezonRadioButton';
import { style } from '../NotificationSetting.styles';

interface FilterCheckboxProps {
	defaultNotifyName?: string;
	onCheckboxPress: (checked: boolean, id: number | string) => void;
	customStyles?: ViewStyle;
	leftIcon?: JSX.Element;
	item: IOptionsNotification;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = React.memo(({ item, defaultNotifyName, onCheckboxPress, customStyles = {}, leftIcon }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const handleCheckboxPress = () => {
		onCheckboxPress(!item?.isChecked, item?.id);
	};

	return (
		<TouchableOpacity activeOpacity={0.6} onPress={handleCheckboxPress} style={[styles.option, customStyles]}>
			<View>
				<View style={[leftIcon ? styles.leftIcon : {}]}>
					{leftIcon && (
						<View style={{ width: 20, height: 20, marginRight: size.s_10, flexDirection: 'row', alignItems: 'center' }}>{leftIcon}</View>
					)}
					<Text style={styles.labelOption}>{item?.label}</Text>
				</View>
				{[ENotificationTypes.DEFAULT].includes?.(item?.value) && <Text style={styles.defaultNotifyName}>{defaultNotifyName}</Text>}
			</View>

			<MezonRadioButton checked={item?.isChecked} onChange={handleCheckboxPress} />
		</TouchableOpacity>
	);
});

export default FilterCheckbox;
