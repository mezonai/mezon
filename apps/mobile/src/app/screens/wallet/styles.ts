import { Attributes, size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.7;

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			flex: 1
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_8,
			paddingTop: size.s_4,
			paddingBottom: size.s_8,
			borderBottomWidth: 1,
			borderBottomColor: colors.border
		},
		menuButton: {
			padding: size.s_8,
			marginRight: size.s_12
		},
		hamburger: {
			width: size.s_20,
			height: size.s_16,
			justifyContent: 'space-between'
		},
		hamburgerLine: {
			height: 2,
			width: '100%',
			borderRadius: 1
		},
		headerText: {
			color: colors.white,
			fontSize: size.s_18,
			fontWeight: '600'
		},
		overlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'black',
			zIndex: 1000
		},
		overlayTouch: {
			flex: 1
		},
		drawer: {
			position: 'absolute',
			top: 0,
			left: 0,
			bottom: 0,
			width: DRAWER_WIDTH,
			zIndex: 1001
		},
		drawerContainer: {
			flex: 1,
			backgroundColor: colors.primary,
			shadowColor: '#000',
			shadowOffset: {
				width: 2,
				height: 0
			},
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5
		},
		drawerContent: {
			flex: 1
		},
		drawerHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: size.s_16,
			paddingLeft: size.s_22,
			paddingRight: 0,
			borderBottomWidth: 1,
			borderBottomColor: colors.border
		},
		headerTitle: {
			fontSize: size.s_18,
			color: colors.text,
			fontWeight: 'bold'
		},
		closeButton: {
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_6
		},
		closeButtonText: {
			fontSize: size.s_18,
			color: colors.text
		},
		menuContainer: {
			flex: 1,
			paddingTop: size.s_18
		},
		menuItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_20,
			gap: size.s_16,
			paddingVertical: size.s_14,
			borderBottomWidth: 0.5,
			borderBottomColor: colors.border
		},
		menuText: {
			fontSize: size.s_15,
			color: colors.text,
			fontWeight: '600'
		},
		gestureArea: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: 20,
			height: '100%',
			zIndex: 999
		}
	});
