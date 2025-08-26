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
				features: '',
				developers: '',
				overview: ''
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
	},
	chat: {
		direct_message: {
			chat_list: '',
			chat_item: {
				username: '',
				close_dm_button: '',
				text_area: '',
				namegroup: ''
			},
			create_group: {
				button: ''
			},
			leave_group: {
				button: ''
			},
			search_input: '',
			friend_list: {
				friend_item: '',
				username_friend_item: '',
				all_friend: ''
			},
			member_list: {
				button: '',
				member_count: ''
			},
			add_to_group: {
				button: ''
			},
			message: {
				item: ''
			},
			menu: {
				leave_group: {
					button: ''
				}
			}
		},
		channel_message: {
			actions: {
				add_reaction: '',
				give_a_coffee: '',
				edit_message: '',
				pin_message: '',
				reply: '',
				copy_text: '',
				add_to_inbox: '',
				mark_unread: '',
				topic_discussion: '',
				forward_message: '',
				delete_message: ''
			}
		},
		mention: {
			input: '',
			selected_file: '',
			voice: '',
			gif: '',
			emoji: '',
			sticker: ''
		}
	},
	onboarding: {
		chat: {
			container: {
				invite_member: '',
				send_first_message: '',
				download_app: '',
				create_channel: ''
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
