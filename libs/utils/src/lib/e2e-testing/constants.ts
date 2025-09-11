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
	avatar: {
		image: ''
	},
	button: {
		base: ''
	},
	base_profile: {
		display_name: ''
	},
	mention: {
		input: '',
		selected_file: ''
	},
	discussion: {
		box: {
			thread: '',
			topic: ''
		}
	},
	homepage: {
		header: {
			link: '',
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
			clan_item: {
				name: ''
			},
			channel_list: {
				category: ''
			},
			button: {
				add_clan: '',
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
			},
			create_channel: {
				type: '',
				input: {
					channel_name: ''
				},
				toggle: {
					is_private: ''
				},
				button: {
					confirm: '',
					cancel: ''
				}
			}
		},
		settings: {
			sidebar: {
				delete: ''
			},
			modal: {
				delete_clan: {
					input: '',
					confirm: '',
					cancel: ''
				}
			}
		},
		channel_list: {
			item: {
				icon: {
					hashtag: '',
					voice: '',
					stream: ''
				},
				name: ''
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
			button: {
				add_user: '',
				create_group: '',
				button_plus: ''
			},
			edit_group: {
				button: '',
				input: '',
				save_button: ''
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
			header: {
				left_container: '',
				right_container: '',
				text: {
					channel_name: ''
				},
				button: {
					file: '',
					mute: '',
					inbox: '',
					pin: '',
					canvas: '',
					thread: '',
					chat: ''
				}
			},
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
			},
			thread_name_input: {
				thread_box: ''
			}
		},
		mention: {
			input: '',
			selected_file: '',
			voice: '',
			gif: '',
			emoji: '',
			sticker: ''
		},
		suggest_item: ''
	},
	onboarding: {
		chat: {
			guide_sections: ''
		}
	},
	user_setting: {
		account: {
			exit_setting: '',
			edit_profile: '',
			edit_display_name: '',
			edit_username: '',
			set_password: '',
			tab_account: ''
		},
		profile: {
			button_setting: '',
			tab_profile: '',
			user_profile: {
				input: {
					display_name: ''
				},
				button: {
					reset: '',
					save_changes: ''
				}
			},
			clan_profile: {
				button: '',
				select: '',
				input_nickname: '',
				button_remove_avatar: '',
				button_change_avatar: '',
				button_reset: '',
				button_save_changes: ''
			}
		}
	},
	common: {
		friend_list: {
			username: ''
		},
		item_pin_message: {
			username: ''
		},
		delete_pin_message: {
			username: ''
		}
	}
};
type DotNestedKeys<T> = T extends object
	? {
			[K in Extract<keyof T, string>]: T[K] extends object ? K | `${K}.${DotNestedKeys<T[K]>}` : K;
		}[Extract<keyof T, string>]
	: never;

export type E2eKeyType = DotNestedKeys<typeof DATA_E2E_IDENTIFIER>;
