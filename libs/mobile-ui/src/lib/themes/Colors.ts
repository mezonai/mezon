// const isDarkTheme = Appearance.getColorScheme() === 'dark';
// TODO: hardcode to check only dark theme
const isDarkTheme = true;

/**
 * Basic Colors
 */
const BaseColors = {
	white: '#FFFFFF',
	black: '#000000',

	red100: '#FFCDD2',
	red200: '#EF9A9A',
	red300: '#E57373',
	red400: '#EF5350',
	red500: '#F44336',
	red600: '#E53935',
	red700: '#D32F2F',

	violet100: '#E5E9FA',
	violet200: '#CFD5F6',
	violet300: '#9398E6',
	violet400: '#7977DB',
	violet500: '#695ECD',
	violet600: '#5A4EB4',

	green100: '#E0F8E9',
	green200: '#C3EFD4',
	green300: '#95E0B3',
	green400: '#5FC98A',
	green500: '#40C174',
	green600: '#30A65F',

	yellow100: '#FFF9EB',
	yellow200: '#FFEEC6',
	yellow300: '#FFDB88',
	yellow400: '#FFCC67',
	yellow500: '#FFBF41',
	yellow600: '#F8B83A',

	orange100: '#FFEDD5',
	orange200: '#FED8AA',
	orange300: '#FEBB73',
	orange400: '#FC943B',
	orange500: '#FA781A',
	orange600: '#EB5A0B',

	blue100: '#DFEAFA',
	blue200: '#C6DAF7',
	blue300: '#9FC2F1',
	blue400: '#71A1E9',
	blue500: '#4A7CE0',
	blue600: '#3B64D5',

	brand100: '#E1F8F5',
	brand200: '#D1F0ED',
	brand300: '#B9E8E4',
	brand400: '#33BBB2',
	brand500: '#00AA9F',
	brand600: '#0AA095',
	brand700: '#38DBD0',

	gray50: '#F2F5F7',
	gray100: '#E7EAED',
	gray150: '#E6E6E6',
	gray200: '#D8DCDF',
	gray300: '#B9BEC0',
	gray400: '#999999',
	gray500: '#646464',
	gray600: '#3D3D3D',
	gray700: '#202020',
	gray800: '#121212',
	gray900: '#0C0C0C'
};

//TODO: can update more
const darkThemeColor = {
	/* text color */
	text: BaseColors.white,
	textGray: BaseColors.gray400,

	/* background color */
	bgDefault: BaseColors.gray500,
	bgGray: BaseColors.gray700,
	bgCharcoal: BaseColors.gray600,

	/* border color */
	borderGray: BaseColors.gray600,
	borderRed: BaseColors.red600
};

const lightThemeColor = {
	/* text color */
	text: BaseColors.black,
	textGray: BaseColors.gray400,

	/* background color */
	bgDefault: BaseColors.white,
	bgGray: BaseColors.gray700,
	bgCharcoal: BaseColors.gray600,

	/* border color */
	borderGray: BaseColors.gray600,
	borderRed: BaseColors.red600
};

const colors = {
	primary: isDarkTheme ? '#1E1F22' : '#FFFFFF',
	secondary: isDarkTheme ? '#242427' : '#F0F0F0',
	secondaryWeight: isDarkTheme ? '#212122' : '#F0F0F0',
	secondaryLight: isDarkTheme ? '#2A2D31' : '#F0F0F0',
	surface: isDarkTheme ? '#0B0B0B' : '#F7F7F7',
	transparent: 'rgba(0,0,0,0)',
	white: isDarkTheme ? '#FFFFFF' : '#000000',
	black: isDarkTheme ? '#000000' : '#FFFFFF',
	textGray: isDarkTheme ? '#c7c7c7' : '#c7c7c7',
	titleReset: isDarkTheme ? 'rgba(148, 154, 164, 1)' : 'rgb(44,44,45)',
	gray72: isDarkTheme ? '#727272' : '#727272',
	tertiary: isDarkTheme ? '#ccc' : '#AEAEAE',
	tertiaryWeight: isDarkTheme ? '#1E1E1E' : '#E1E1E1',
	gray48: isDarkTheme ? '#484848' : '#484848',
	gray4850: isDarkTheme ? '#484848e0' : '#484848e0',
	textLink: '#007AFF',
	borderDim: isDarkTheme ? '#5a5b5c30' : '#5a5b5c30',
	/* border color */
	borderNeutralDisable: '#9091931a',
	borderPrimary: '#363940',
	borderMessageHighlight: '#F0B132',
	borderMessageReply: '#2882f0',
	borderGrayishBrown: '#7f7e7e87',
	/* text color */
	header1: '#888c94',
	header2: '#676b73',
	titleSteelGray: '#939292',
	textRed: '#E53935',
	textViolet: '#5a62f4',
	azureBlue: '#4173c3',
	caribbeanGreen: '#1FA07C',
	vividScarlet: '#d1323f',
	/* background color */
	bgPrimary: isDarkTheme ? '#3e4247' : '#FFFFFF',
	bgViolet: isDarkTheme ? '#5a62f4' : '#5a62f4',
	bgGrayLight: '#676b73',
	bgGrayDark: '#676b73',
	bgDarkSlate: '#2a2e31',
	bgCharcoal: '#313338',
	bgMention: '#3b426e',
	red: 'red',
	danger: '#dc3545',
	orange: '#e77132',
	goldenrodYellow: '#f2b13a',
	green: 'green',
	bgDarkCharcoal: '#323232',
	bgMessageHighlight: 'rgba(201,157,7,0.1)',
	bgDarkMidnightBlue: '#141c2a',
	midnightIndigoBg: '#3b426e',
	bgReply: '#383B47',
	midnightBlue: '#3b426e',
	jetBlack: '#29292b',
	darkCharcoalGray: '#2b2b2e',
	// background button
	pink: '#e148c7',
	bgButton: '#5865f2',
	bgToggleOnBtn: '#008ECC',
	bgToggleOffBtn: '#c3c3c3',
	charcoalBlack: '#1e1f22',
	mentionBg: 'rgba(60, 66, 112, 0.5)',
	darkGray: '#333333',
	persianRed: '#DA373C',
	outerSpace: '#404249',
	jungleGreen: '#23A559',
	linkText: '#dfe0e4'
};

export { colors, darkThemeColor, lightThemeColor };
