import { useTheme } from '@mezon/mobile-ui';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { style } from './styles';

interface IMezonRadioButton {
	onChange?: (isCheck: boolean) => void;
	checked?: boolean;
	noSwitchFalse?: boolean;
	disabled?: boolean;
	type?: 'radio' | 'checkbox';
}

export default function MezonRadioButton({ onChange, checked, noSwitchFalse, disabled = false, type = 'radio' }: IMezonRadioButton) {
	const styles = style(useTheme().themeValue);
	const [isChecked, setChecked] = useState<boolean>(checked);

	useEffect(() => {
		if (checked != isChecked) setChecked(checked);
	}, [checked]);

	function handleToggle() {
		try {
			if (noSwitchFalse) {
				setChecked(true);
				onChange && onChange(true);
			} else {
				onChange && onChange(!isChecked);
				setChecked(!isChecked);
			}
		} catch (error) {
			console.error('Error in handleToggle:', error);
		}
	}

	if (type === 'checkbox') {
		return (
			<TouchableOpacity onPress={handleToggle} style={styles.container} disabled={disabled}>
				<View style={[styles.checkboxOuter, isChecked && styles.checkboxOuterChecked]}>
					{isChecked && <Text style={styles.checkmark}>✓</Text>}
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity onPress={handleToggle} style={styles.container} disabled={disabled}>
			<View style={[styles.outer, isChecked && styles.outerChecked]}>
				<View style={[styles.inner, isChecked && styles.innerChecked]} />
			</View>
		</TouchableOpacity>
	);
}
