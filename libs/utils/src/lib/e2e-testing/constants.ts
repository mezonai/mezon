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
	},
	chat: {
		'direct-message': {
			'chat-list': '',
			'chat-item': {
				username: '',
				'close-DM-button': '',
				'text-area': '',
				namegroup: ''
			},
			'create-group': {
				button: ''
			},
			'leave-group': {
				button: ''
			},
			'search-input': '',
			'friend-list': {
				'friend-item': '',
				'username-friend-item': '',
				'all-friend': ''
			},
			'member-list': {
				button: '',
				'member-count': '',
			},
			'add-to-group': {
				button: '',
			},
			message: {
				item: '',
			},
			menu: {
				'leave-group': {
					button: ''
				}
			}
		},
	}
};

type DotNestedKeys<T> = T extends object
	? {
		[K in Extract<keyof T, string>]: T[K] extends object ? K | `${K}.${DotNestedKeys<T[K]>}` : K;
	}[Extract<keyof T, string>]
	: never;

export type E2eKeyType = DotNestedKeys<typeof DATA_E2E_IDENTIFIER>;
