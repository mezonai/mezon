import { verticalScale } from './Metrics';

const family = {
	arial: 'Arial'
};

const type = {
	light: '',
	medium: '',
	regular: '',
	bold: '',
	base: ''
};

export const size = {
	h1: verticalScale(38),
	h2: verticalScale(34),
	h3: verticalScale(30),
	h4: verticalScale(26),
	h5: verticalScale(20),
	h6: verticalScale(19),
	h7: verticalScale(14),
	h85: verticalScale(12),
	h8: verticalScale(11),
	h9: verticalScale(9),
	input: verticalScale(18),
	regular: verticalScale(17),
	medium: verticalScale(14.5),
	small: verticalScale(12),
	tiny: verticalScale(9),
	label: verticalScale(16),

	s_2: verticalScale(2),
	s_8: verticalScale(8),
	s_4: verticalScale(4),
	s_6: verticalScale(6),
	s_10: verticalScale(10),
	s_12: verticalScale(12),
	s_14: verticalScale(14),
	s_18: verticalScale(18),
	s_20: verticalScale(20),
	s_24: verticalScale(24),

	s_13: verticalScale(13),
	s_15: verticalScale(15),
	s_16: verticalScale(16),
	s_17: verticalScale(17),
	s_22: verticalScale(22),
	s_28: verticalScale(28),
	s_30: verticalScale(30),
	s_34: verticalScale(34),
	s_36: verticalScale(36),
	s_32: verticalScale(32),
	s_40: verticalScale(40),
	s_48: verticalScale(48),
	s_50: verticalScale(50),
	s_60: verticalScale(60),
	s_70: verticalScale(70),
	s_80: verticalScale(80),
	s_100: verticalScale(100),
	s_150: verticalScale(150)
};

const style = {
	h1: {
		fontFamily: type.base,
		fontSize: size.h1
	},
	h2: {
		fontWeight: 'bold',
		fontSize: size.h2
	},
	h4: {
		fontFamily: type.base,
		fontSize: size.h4
	},
	h5: {
		fontFamily: type.base,
		fontSize: size.h5
	},
	h6: {
		fontFamily: type.base,
		fontSize: size.h6
	},
	normal: {
		fontFamily: type.base,
		fontSize: size.regular
	},
	description: {
		fontFamily: type.base,
		fontSize: size.medium
	},
	label: {
		fontFamily: type.base,
		fontSize: size.label
	}
};

export default {
	type,
	size,
	style,
	family
};
