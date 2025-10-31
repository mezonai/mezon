export const BOX_SHADOW_DEFAULT = {
	boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px'
} as const;

export const OVERFLOW_AUTO = {
	overflow: 'auto'
} as const;

export const OVERFLOW_HIDDEN = {
	overflow: 'hidden'
} as const;

export const TEXT_ELLIPSIS = {
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap'
} as const;

export const WORD_BREAK = {
	wordBreak: 'break-word'
} as const;

export const GRADIENT_TEXT_WEBKIT = {
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text'
} as const;

export const GRADIENT_PRIMARY = {
	background: 'linear-gradient(349.47deg, #1D5AFA -9.25%, #F8E4F0 90.24%)',
	...GRADIENT_TEXT_WEBKIT
} as const;

export const GRADIENT_PURPLE_BLUE = {
	background: 'linear-gradient(90deg, #9C3FE9 0%, #1D5AFA 100%)',
	...GRADIENT_TEXT_WEBKIT
} as const;

export const POSITION_ABSOLUTE = {
	position: 'absolute' as const
};

export const POSITION_RELATIVE = {
	position: 'relative' as const
};

export const FULL_WIDTH_HEIGHT = {
	width: '100%',
	height: '100%'
} as const;

export const FULL_WIDTH = {
	width: '100%'
} as const;

export const WEBKIT_NO_DRAG = {
	WebkitAppRegion: 'no-drag'
} as React.CSSProperties;
