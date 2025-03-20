import { baseColor, useTheme } from '@mezon/mobile-ui';
import React, { ReactNode, useEffect, useState } from 'react';
import { SwitchProps, TouchableOpacity, View } from 'react-native';
import { IconCDN } from '../../constants/icon_cdn';
import MezonIconCDN from '../MezonIconCDN';
import { style } from './styles';

interface IMezonSwitch extends SwitchProps {
	iconOn?: ReactNode;
	iconOff?: ReactNode;
	iconYesNo?: boolean;
	disabled?: boolean;
}

export const MezonSwitch = ({ value, onValueChange, iconYesNo, iconOn, iconOff, disabled = false }: IMezonSwitch) => {
	const [isEnabled, setIsEnabled] = useState(value);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	useEffect(() => {
		if (value !== isEnabled) setIsEnabled(value);
	}, [value]);

	const toggleSwitch = () => {
		onValueChange && onValueChange(!isEnabled);
		setIsEnabled((previousState) => !previousState);
	};

	return (
		<TouchableOpacity
			style={[styles.switchContainer, isEnabled ? styles.switchContainerEnabled : {}, disabled ? styles.disabled : {}]}
			onPress={toggleSwitch}
			disabled={disabled}
		>
			<View style={[styles.circle, isEnabled ? styles.circleEnabled : {}]}>
				{iconYesNo ? (
					isEnabled ? (
						<MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.blurple} height={22} width={22} />
					) : (
						<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.secondary} height={20} width={20} />
					)
				) : isEnabled ? (
					iconOn
				) : (
					iconOff
				)}
			</View>
		</TouchableOpacity>
	);
};

export default MezonSwitch;
