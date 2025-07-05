import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (theme: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.primary
		},
        header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			padding: size.s_8,
			backgroundColor: theme.primary
		},
        backButton: {
			paddingRight: size.s_12
		},
        title: {
			fontSize: size.s_20,
			color: theme.textStrong,
			marginLeft: size.s_10
		},
		subtitle: {
			fontSize: size.s_20,
			fontWeight: 'normal'
		},
		mezonBold: {
			fontWeight: '900'
		},
	});
