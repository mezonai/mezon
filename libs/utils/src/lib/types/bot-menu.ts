export interface BotMenuAction {
	type: 'uri' | 'message' | 'postback' | 'datetime_picker' | 'camera' | 'camera_roll' | 'location';
	label?: string;
	uri?: string;
	text?: string;
	data?: string;
}

export interface BotMenuArea {
	bounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	action: BotMenuAction;
}

export interface BotMenuSize {
	width: number;
	height: number;
}

export interface BotMenuConfig {
	richMenuId: string;
	size: BotMenuSize;
	selected: boolean;
	name: string;
	chatBarText: string;
	areas: BotMenuArea[];
}

export interface BotInfo {
	id: string;
	name: string;
	avatar?: string;
	description?: string;
	isActive?: boolean;
}

export interface BotMenuSystem {
	bot: BotInfo;
	menu: BotMenuConfig;
}

// Simple grid-based menu for easier implementation
export interface BotMenuItem {
	id: string;
	label: string;
	action: BotMenuAction;
	icon?: string;
	backgroundColor?: string;
	textColor?: string;
}

export interface BotMenuGrid {
	columns: number;
	rows: number;
	items: BotMenuItem[];
}

export interface SimpleBotMenu {
	richMenuId: string;
	name: string;
	chatBarText: string;
	selected: boolean;
	grid: BotMenuGrid;
}

export interface SimpleBotMenuSystem {
	bot: BotInfo;
	menu: SimpleBotMenu;
}
