import { baseColor, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: any) =>
	StyleSheet.create({
		imageFullSize: {
			width: '100%',
			height: '100%'
		},
		channelHashText: {
			fontSize: verticalScale(20),
			textAlign: 'center',
			color: themeValue.white
		},
		nameContainer: {
			flex: 1,
			justifyContent: 'center'
		},
		nameText: {
			color: themeValue.textStrong
		},
		checkboxContainer: {
			paddingLeft: size.s_8,
			width: size.s_30
		},
		checkboxIconStyle: {
			borderRadius: size.s_6
		}
	});

export const getCheckboxInnerIconStyle = (isChecked: boolean, themeValue: any) => ({
	borderWidth: 1.5,
	borderColor: isChecked ? baseColor.bgButtonPrimary : themeValue.white,
	borderRadius: 5,
	opacity: 1
});
