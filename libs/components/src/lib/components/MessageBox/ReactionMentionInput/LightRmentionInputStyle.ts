import { OverflowY } from '@mezon/utils';

export default {
	control: {
		fontSize: 16
	},

	'&multiLine': {
		control: {
			fontFamily: 'gg sans, sans-serif',
			minHeight: 35,
			border: 'none',
			outline: 'none'
		},
		highlighter: {
			padding: '9px 120px 9px 9px',
			border: '1px solid transparent',
			maxHeight: '350px'
		},
		input: {
			padding: '9px 120px 9px 9px',
			border: 'none',
			outline: 'none',
			whiteSpace: 'pre-wrap',
			overflow: 'hidden auto'
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
