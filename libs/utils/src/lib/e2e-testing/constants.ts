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
		'direct_message': {
			'chat_list': '',
			'chat_item': {
				username: '',
				'close_dm_button': '',
				'text_area': '',
				namegroup: ''
			},
			'create_group': {
				button: ''
			},
			'leave_group': {
				button: ''
			},
			'search_input': '',
			'friend_list': {
				'friend_item': '',
				'username_friend_item': '',
				'all_friend': ''
			},
			'member_list': {
				button: '',
				'member_count': '',
			},
			'add_to_group': {
				button: '',
			},
			message: {
				item: '',
			},
			menu: {
				'leave_group': {
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
