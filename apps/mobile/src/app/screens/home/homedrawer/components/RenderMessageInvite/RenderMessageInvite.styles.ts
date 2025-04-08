import { Attributes, baseColor, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		statusCircle: {
			width: size.s_12,
			height: size.s_12,
			borderRadius: size.s_50,
			borderWidth: 2,
			borderColor: colors.secondary
		},
		online: {
			backgroundColor: baseColor.green
		},
		offline: {
			backgroundColor: baseColor.gray
		},
		textLink: { color: Colors.textLink, marginBottom: size.s_6 },
		boxLink: {
			backgroundColor: Colors?.bgCharcoal,
			maxWidth: '100%',
			alignSelf: 'flex-start',
			padding: size.s_10,
			paddingHorizontal: size.s_16,
			borderRadius: size.s_10
		},
		title: {
			color: Colors?.textGray,
			fontSize: size.h7,
			fontWeight: '600',
			marginBottom: size.s_10,
			alignSelf: 'flex-start'
		},
		container: { flexDirection: 'row', gap: size.s_10, marginBottom: size.s_16, alignItems: 'center' },
		clanName: { color: Colors?.white, fontSize: size.label, fontWeight: '600' },
		boxStatus: { flexDirection: 'row', gap: size.s_10, marginTop: size.s_6, alignItems: 'center' },
		memberStatus: { flexDirection: 'row', alignItems: 'center', gap: size.s_4 },
		textStatus: { color: Colors?.textGray, fontSize: size.small, fontWeight: '600' },
		textContent: { color: colors.text, fontSize: size.label, fontWeight: '400' },
		inviteClanBtn: {
			padding: size.s_10,
			maxWidth: '100%',
			backgroundColor: Colors.bgButton,
			borderRadius: size.s_10
		},
		inviteClanBtnText: {
			color: Colors?.white,
			fontSize: size.small,
			fontWeight: '600',
			textAlign: 'center'
		}
	});
