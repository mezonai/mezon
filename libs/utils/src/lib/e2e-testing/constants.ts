/*
 * [SCREEN]:{
 * 	[SECTION]:{
 * 		[SUB_SECTION]: {
 * 			COMPONENT: {
 * 				id: ''
 * 			}
 * 		}
 * 	}
 * }
 * */

export const DATA_E2E_IDENTIFIER = {
	homepage: {
		header: {
			link: {
				home: '',
				feature: '',
				developers: ''
			},
			button: {
				login: '',
				menu: ''
			},
			container: {
				navigation: ''
			}
		},
		'main-page': {
			container: '',
			heading: {
				title: ''
			}
		},
		layout: {
			title: {
				features: ''
			}
		},
		footer: {
			text: {
				copyright: ''
			}
		}
	}
};

type DotNestedKeys<T> = T extends object
	? {
			[K in Extract<keyof T, string>]: T[K] extends object ? K | `${K}.${DotNestedKeys<T[K]>}` : K;
		}[Extract<keyof T, string>]
	: never;

export type E2eKeyType = DotNestedKeys<typeof DATA_E2E_IDENTIFIER>;
