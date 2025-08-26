export enum FormatOption {
	PARAGRAPH = 'paragraph',
	HEADER_1 = '1',
	HEADER_2 = '2',
	HEADER_3 = '3',
	CHECKLIST = 'check',
	ORDERED_LIST = 'ordered',
	BULLET_LIST = 'bullet',
	BLOCKQUOTE = 'blockquote'
}

export enum ListType {
	CHECKED = 'checked',
	UNCHECKED = 'unchecked',
	ORDERED = 'ordered',
	BULLET = 'bullet'
}

export enum HeaderLevel {
	H1 = 1,
	H2 = 2,
	H3 = 3
}

export enum TextStyle {
	BOLD = 'bold',
	ITALIC = 'italic',
	UNDERLINE = 'underline',
	STRIKE = 'strike',
	CODE_BLOCK = 'code-block'
}

export interface ActiveFormats {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike: boolean;
	'code-block': boolean;
	link: string;
	h1: boolean;
	h2: boolean;
	h3: boolean;
	paragraph: boolean;
	check: boolean;
	ordered: boolean;
	bullet: boolean;
	blockquote: boolean;
	image: string;
}

export const getActiveOptionFromFormats = (formats: Record<string, any>): string => {
	if (formats?.header === HeaderLevel.H1) {
		return FormatOption.HEADER_1;
	} else if (formats?.header === HeaderLevel.H2) {
		return FormatOption.HEADER_2;
	} else if (formats?.header === HeaderLevel.H3) {
		return FormatOption.HEADER_3;
	} else if (formats?.list === ListType.CHECKED || formats?.list === ListType.UNCHECKED) {
		return FormatOption.CHECKLIST;
	} else if (formats?.list === ListType.ORDERED) {
		return FormatOption.ORDERED_LIST;
	} else if (formats?.list === ListType.BULLET) {
		return FormatOption.BULLET_LIST;
	} else if (formats?.blockquote === true) {
		return FormatOption.BLOCKQUOTE;
	}

	return FormatOption.PARAGRAPH;
};

export const isParagraphFormat = (formats: Record<string, any>): boolean => {
	return !(
		formats?.header === HeaderLevel.H1 ||
		formats?.header === HeaderLevel.H2 ||
		formats?.header === HeaderLevel.H3 ||
		formats?.list === ListType.CHECKED ||
		formats?.list === ListType.UNCHECKED ||
		formats?.list === ListType.ORDERED ||
		formats?.list === ListType.BULLET ||
		!!formats?.blockquote
	);
};

export const getActiveFormatsFromQuill = (formats: Record<string, any>) => {
	return {
		bold: !!formats.bold,
		italic: !!formats.italic,
		underline: !!formats.underline,
		strike: !!formats.strike,
		'code-block': formats?.['code-block'] === 'plain',
		link: formats?.link as string,
		h1: formats?.header === HeaderLevel.H1,
		h2: formats?.header === HeaderLevel.H2,
		h3: formats?.header === HeaderLevel.H3,
		paragraph: isParagraphFormat(formats),
		check: formats?.list === ListType.CHECKED || formats?.list === ListType.UNCHECKED,
		ordered: formats?.list === ListType.ORDERED,
		bullet: formats?.list === ListType.BULLET,
		blockquote: !!formats?.blockquote,
		image: (formats?.image as string) || ''
	};
};

export const getDefaultActiveFormats = (isParagraph: boolean = false) => {
	return {
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		'code-block': false,
		link: '',
		h1: false,
		h2: false,
		h3: false,
		paragraph: isParagraph,
		check: false,
		ordered: false,
		bullet: false,
		blockquote: false,
		image: ''
	};
};
