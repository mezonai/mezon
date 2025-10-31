import type { OverflowY } from '@mezon/utils';

export default {
	control: {
		fontSize: 16
	},

	'&multiLine': {
		control: {
			fontFamily: 'gg sans, sans-serif',
			border: 'none',
			outline: 'none'
		},
		highlighter: {
			border: '1px solid transparent'
		},
		input: {
			padding: '9px 12px',
			border: 'none',
			outline: 'none',
			whiteSpace: 'pre-wrap'
		}
	},

	'&singleLine': {
		display: 'inline-block',
		width: 180,

		highlighter: {
			padding: 1,
			border: '2px inset transparent'
		},
		input: {
			padding: 1,
			border: '2px inset'
		}
	},

	suggestions: {
		width: '100%',
		left: '0px',
		top: '20px',
		list: {
			overflowY: 'auto' as OverflowY,
			maxHeight: '450px'
		},
		item: {
			margin: '0 8px',
			padding: '8px',
			'&focused': {
				backgroundColor: '#E5E6E8',
				borderRadius: 3
			}
		}
	}
};
