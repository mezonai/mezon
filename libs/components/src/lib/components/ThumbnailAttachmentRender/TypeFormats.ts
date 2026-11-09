export type FileIconName = 'mzFile' | 'mzFileArchive' | 'mzFileAudio' | 'mzFileCode' | 'mzFilePdf' | 'mzFileSheet' | 'mzFileText';

export const typeFormats: { type: string; icon: FileIconName }[] = [
	{
		type: 'text/plain',
		icon: 'mzFileText'
	},
	{
		type: 'text/html',
		icon: 'mzFileCode'
	},
	{
		type: 'text/css',
		icon: 'mzFileCode'
	},
	{
		type: 'application/xml',
		icon: 'mzFileCode'
	},
	{
		type: 'application/javascript',
		icon: 'mzFileCode'
	},
	{
		type: 'application/json',
		icon: 'mzFileCode'
	},

	{
		type: 'image/svg+xml',
		icon: 'mzFileCode'
	},

	{
		type: 'audio/mpeg',
		icon: 'mzFileAudio'
	},

	{
		type: 'application/pdf',
		icon: 'mzFilePdf'
	},
	{
		type: 'application/msword',
		icon: 'mzFileText'
	},
	{
		type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		icon: 'mzFileText'
	},
	{
		type: 'docx',
		icon: 'mzFileText'
	},
	{
		type: 'application/vnd.ms-powerpoint',
		icon: 'mzFileText'
	},
	{
		type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		icon: 'mzFileText'
	},
	{
		type: 'pptx',
		icon: 'mzFileText'
	},
	{
		type: 'application/vnd.ms-excel',
		icon: 'mzFileSheet'
	},
	{
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		icon: 'mzFileSheet'
	},
	{
		type: 'xlsx',
		icon: 'mzFileSheet'
	},
	{
		type: 'text/csv',
		icon: 'mzFileSheet'
	},

	{
		type: 'application/zip',
		icon: 'mzFileArchive'
	},
	{
		type: 'application/vnd.rar',
		icon: 'mzFileArchive'
	},

	{
		type: 'application/x-compressed',
		icon: 'mzFileArchive'
	},
	{
		type: 'application/x-7z-compressed',
		icon: 'mzFileArchive'
	},
	{
		type: 'application/x-zip-compressed',
		icon: 'mzFileArchive'
	},
	{
		type: 'text/markdown',
		icon: 'mzFileText'
	}
];
