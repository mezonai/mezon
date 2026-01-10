import type { MentionItem } from '@mezon/utils';
import type { ChannelStreamMode } from 'mezon-js';
import type { ApiSearchMessageRequest } from 'mezon-js/types';

export type OnChangeHandlerFunc = (
	event: { target: { value: string } },
	newValue: string,
	newPlainTextValue: string,
	mentions: MentionItem[]
) => void;

export interface SearchInputProps {
	channelId: string;
	mode?: ChannelStreamMode;
	currentClanId?: string;
	valueInputSearch: string;
	valueDisplay: string;
	searchedRequest: ApiSearchMessageRequest | null;
	appearanceTheme: string;
	lightMentionsInputStyle: any;
	darkMentionsInputStyle: any;
	searchRef: React.RefObject<HTMLInputElement>;
	onInputClick: () => void;
	onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>) => void;
	onChange: OnChangeHandlerFunc;
	setIsShowSearchOptions: (value: string) => void;
}

export interface SearchBarProps {
	expanded: boolean;
	valueInputSearch: string;
	valueDisplay: string;
	channelId: string;
	mode?: ChannelStreamMode;
	currentClanId?: string;
	searchedRequest: ApiSearchMessageRequest | null;
	appearanceTheme: string;
	lightMentionsInputStyle: any;
	darkMentionsInputStyle: any;
	searchRef: React.RefObject<HTMLInputElement>;
	onInputClick: () => void;
	onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>) => void;
	onChange: OnChangeHandlerFunc;
	onClose: () => void;
	setIsShowSearchOptions: (value: string) => void;
}

export interface SearchMessageChannelProps {
	mode?: ChannelStreamMode;
}

export interface UserMentionData {
	id: string;
	display: string;
	avatarUrl: string;
	subDisplay: string;
}

export interface HasOption {
	id: string;
	display: string;
}

export interface ChannelOption {
	id: string;
	display: string;
}
