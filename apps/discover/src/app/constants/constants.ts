import Mezon_Dark from '../assets/Logo_mezon_dark.png';
import Mezon_Light from '../assets/Logo_mezon_light.png';
import No_Banner from '../assets/no_banner.jpg';
import No_Logo from '../assets/no_logo.png';

export const NAVIGATION_LINKS = {
	HOME: {
		url: 'https://mezon.ai',
		label: 'Home'
	},
	DEVELOPERS: {
		url: 'https://mezon.ai/developers/applications',
		label: 'Developers'
	},
	BOTS_APPS: {
		url: 'https://top.mezon.ai',
		label: 'Bots/Apps'
	},
	DOCUMENTS: {
		url: 'docs/',
		label: 'Documents'
	},
	DISCOVER: {
		url: '/clans',
		label: 'Discover'
	}
};
export const MEZON_LOGO = {
	LIGHT: Mezon_Light,
	DARK: Mezon_Dark
};
export const CATEGORY_TYPES = {
	1: {
		icon: 'M4 6h16M4 12h16m-7 6h7',
		gradient: 'from-indigo-400 to-purple-500'
	},
	2: {
		icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
		gradient: 'from-emerald-400 to-teal-500'
	},
	3: {
		icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
		gradient: 'from-yellow-400 to-orange-500'
	},
	4: {
		icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
		gradient: 'from-green-400 to-emerald-600'
	},
	5: {
		icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
		gradient: 'from-blue-400 to-cyan-500'
	},
	6: {
		icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
		gradient: 'from-pink-400 to-rose-500'
	}
};

export const DEFAULT_IMAGES = {
	BANNER: No_Banner,
	LOGO: No_Logo
};

export const PAGINATION = {
	ITEMS_PER_PAGE: 12,
	MAX_PAGE_NUMBERS: 5
};

export const COLORS = {
	PRIMARY: '#5865f2',
	PRIMARY_HOVER: '#4752c4',
	TEXT_PRIMARY: '#7C92AF',
	TEXT_HOVER: '#8FA7BF',
	BORDER: '#4465FF4D'
};

export const Z_INDEX = {
	HEADER: 100,
	MOBILE_MENU: 100,
	DROPDOWN: 50
};

export const BREAKPOINTS = {
	MOBILE: 'md',
	DESKTOP: 'lg'
};
