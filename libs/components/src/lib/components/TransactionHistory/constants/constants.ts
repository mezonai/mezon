export const LIMIT_WALLET = 8;

export type FilterType = 'all' | 'sent' | 'received';

export const TRANSACTION_FILTERS = {
	ALL: 'all',
	SENT: 'sent',
	RECEIVED: 'received'
} as const;

export const API_FILTER_PARAMS = {
	[TRANSACTION_FILTERS.ALL]: undefined,
	[TRANSACTION_FILTERS.SENT]: 2,
	[TRANSACTION_FILTERS.RECEIVED]: 1
};

export const TAB_LABELS = {
	ALL: 'All Transaction',
	SENT: 'Send Transaction',
	RECEIVED: 'Received Transaction'
};

export const TRANSACTION_TYPES = {
	SENT: 'Sent',
	RECEIVED: 'Received'
};

export const EMPTY_STATES = {
	NO_TRANSACTIONS: {
		TITLE: "Can't find any transaction",
		DESCRIPTION: "You haven't made any transactions yet. Your transaction history will appear here once you start sending or receiving tokens."
	},
	NO_FILTERED_TRANSACTIONS: {
		TITLE: "Can't find any transaction",
		DESCRIPTION: 'No transactions found for the selected filter. Please try a different filter or check back later.'
	}
};

export const HEADER = {
	TITLE: 'Transaction History',
	SUBTITLE: 'View all your transaction activities'
};

export const TRANSACTION_DETAIL = {
	FIELDS: {
		TRANSACTION_ID: 'Transaction ID',
		SENDER: 'Sender ',
		AMOUNT: 'Amount',
		RECEIVER: 'Receiver ',
		NOTE: 'Note',
		CREATED: 'Created'
	},
	DEFAULT_NOTE: 'No note',
	COPY_DURATION: 1500,
	UNKNOWN_USER: 'Unknown User'
};

export const TRANSACTION_ITEM = {
	ID_PREFIX: 'Transaction #',
	ID_LENGTH: 8,
	SKELETON_COUNT: 6
};

export const DATE_FORMAT = {
	DAY: '2-digit',
	MONTH: '2-digit',
	YEAR: 'numeric',
	HOURS: '2-digit',
	MINUTES: '2-digit',
	SEPARATOR: '/',
	TIME_SEPARATOR: ' '
};

export const CURRENCY = {
	CODE: 'vi-VN',
	SYMBOL: 'đ'
};
