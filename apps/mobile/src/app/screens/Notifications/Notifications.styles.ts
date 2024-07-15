import { Attributes, Colors, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
import { HEIGHT, WIDTH } from '../../constants/config';

export const style = (colors: Attributes) => StyleSheet.create({
	notifications: {
		width: WIDTH,
		height: HEIGHT,
		backgroundColor: colors.primary,
    paddingVertical: size.s_10
	},

	notificationsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: Metrics.size.m,
	},

	notificationHeaderTitle: {
		fontSize: Fonts.size.h6,
		fontWeight: '600',
		color: colors.textStrong,
	},

	notificationHeaderIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.secondary,
		borderRadius: 50,
		borderWidth: 1,
		borderColor: colors.borderDim,
		height: 35,
		width: 35,
	},

	notificationsList: {
		paddingBottom: 200,
	},

	container: {
		flex: 1,
		padding: 24,
	},

	contentContainer: {
		flex: 1,
		alignItems: 'center',
	},

	removeNotifyText: {
		color: Colors.white,
		fontSize: size.label,
		flex: 1,
		fontWeight: '500',
	},
	removeNotifyContainer: {
		flexDirection: 'row',
		backgroundColor: Colors.bgPrimary,
		width: '100%',
		paddingHorizontal: size.s_10,
		paddingVertical: size.s_16,
		borderRadius: 8,
		gap: size.s_10,
	},
});
