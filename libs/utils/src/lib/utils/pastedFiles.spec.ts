import { IMAGE_MAX_FILE_SIZE, MAX_FILE_ATTACHMENTS, MAX_FILE_SIZE, UploadLimitReason } from '../constant';
import { getAttachmentLimitViolation, getPastedFiles } from './file';

jest.mock('../helper/videoPoster', () => ({ captureVideoPosterFromUrl: jest.fn() }));

const copiedFile = (file: File, isDirectory = false) => ({
	kind: 'file',
	type: file.type,
	getAsFile: () => file,
	webkitGetAsEntry: () => ({ isDirectory })
});

const clipboard = (items: object[]) => ({ items }) as unknown as DataTransfer;

it('takes every copied file, whatever its type, and skips folders and text', () => {
	const pdf = new File(['%PDF'], 'Báo cáo.pdf', { type: 'application/pdf' });
	const zip = new File(['zip'], 'a.zip', { type: 'application/zip' });
	const png = new File(['png'], 'shot.png', { type: 'image/png' });
	const folder = new File([''], 'thư mục', { type: '' });
	const text = { kind: 'string', type: 'text/plain', getAsFile: () => null };

	const pasted = getPastedFiles(clipboard([copiedFile(pdf), copiedFile(folder, true), text, copiedFile(zip), copiedFile(png)]));

	expect(pasted).toEqual([pdf, zip, png]);
	expect(getPastedFiles(null)).toEqual([]);
});

it('keeps a copied file when the browser cannot tell a folder apart', () => {
	const pdf = new File(['%PDF'], 'a.pdf', { type: 'application/pdf' });
	const withoutEntry = { kind: 'file', type: pdf.type, getAsFile: () => pdf };

	expect(getPastedFiles(clipboard([withoutEntry]))).toEqual([pdf]);
});

it('refuses a paste past the attachment count or size limits, as a drop does', () => {
	const pdf = new File(['%PDF'], 'a.pdf', { type: 'application/pdf' });
	const bigImage = { type: 'image/png', size: IMAGE_MAX_FILE_SIZE + 1 } as File;
	const bigFile = { type: 'application/zip', size: MAX_FILE_SIZE + 1 } as File;

	expect(getAttachmentLimitViolation([pdf], 0)).toBeUndefined();
	expect(getAttachmentLimitViolation([pdf], MAX_FILE_ATTACHMENTS)).toEqual({ reason: UploadLimitReason.COUNT });
	expect(getAttachmentLimitViolation([bigImage], 0)).toEqual({ reason: UploadLimitReason.SIZE, limit: IMAGE_MAX_FILE_SIZE });
	expect(getAttachmentLimitViolation([bigFile], 0)).toEqual({ reason: UploadLimitReason.SIZE, limit: MAX_FILE_SIZE });
});
