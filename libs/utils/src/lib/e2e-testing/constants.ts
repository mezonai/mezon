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
		main_page: {
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
	clan_page: {
		header: {
			title: {
				clan_name: ''
			},
			modal_panel: {
				item: '',
				create_category: '',
				invite_people: '',
				clan_settings: '',
				notification_setting: '',
				mark_as_read: '',
				show_empty_category: ''
			}
		},
		side_bar: {
			channel_list: {
				category: ''
			},
			button: {
				add_channel: ''
			}
		},
		modal: {
			create_category: {
				input: {
					category_name: ''
				},
				toggle: {
					private: ''
				},
				button: {
					confirm: '',
					cancel: ''
				}
			},
			create_clan: {
				input: {
					clan_name: ''
				},
				toggle: {
					private: ''
				},
				button: {
					confirm: '',
					cancel: ''
				}
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
