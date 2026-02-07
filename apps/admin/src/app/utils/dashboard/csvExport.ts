import type { AppDispatch } from '@mezon/store';
import { exportChannelsCsv, exportClansCsv, exportUsersCsv } from '@mezon/store';

// Decode base64 CSV and download blobs
const downloadBlob = (blob: Blob, filename: string) => {
	const link = document.createElement('a');
	const blobUrl = URL.createObjectURL(blob);
	link.href = blobUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(blobUrl);
};

const decodeBase64AndDownload = (base64: string, filename: string) => {
	const byteCharacters = atob(base64);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	const csvBlob = new Blob([byteArray], { type: 'text/csv;charset=utf-8;' });
	downloadBlob(csvBlob, filename);
};

export const handleCSVExport = async (
	dispatch: AppDispatch,
	startStr: string,
	endStr: string,
	periodFilter: 'daily' | 'weekly' | 'monthly',
	selectedColumns: string[],
	setIsExporting: (value: boolean) => void,
	sortBy?: string,
	sort?: 'asc' | 'desc'
) => {
	try {
		setIsExporting(true);
		const action = await dispatch(
			exportClansCsv({ start: startStr, end: endStr, rangeType: periodFilter, columns: selectedColumns, sortBy, sort })
		);
		if (exportClansCsv.fulfilled.match(action)) {
			const payload = action.payload;

			// If payload directly contains base64 CSV + filename
			if (payload?.csv_data && payload?.filename) {
				decodeBase64AndDownload(payload.csv_data as string, payload.filename as string);
				return;
			}

			if (payload?.csvData && payload?.filename) {
				decodeBase64AndDownload(payload.csvData as string, payload.filename as string);
				return;
			}

			const blob = payload?.blob as Blob;
			const headersArr = payload?.headers as Array<[string, string]> | undefined;
			const contentDisp = (headersArr || []).find((h) => h[0].toLowerCase() === 'content-disposition')?.[1] || '';
			let filename = `clan_usage_${startStr}_to_${endStr}.csv`;
			const m = contentDisp.match(/filename\*?=(?:UTF-8'')?"?([^;"\n]+)"?/);
			if (m && m[1]) filename = decodeURIComponent(m[1]);

			if (!blob) {
				console.error('No CSV blob in export payload');
				return;
			}

			try {
				const text = await blob.text();
				let parsed: any = null;
				try {
					parsed = JSON.parse(text);
				} catch (e) {
					parsed = null;
				}

				if (parsed?.csv_data && parsed?.filename) {
					decodeBase64AndDownload(parsed.csv_data as string, parsed.filename as string);
					return;
				}

				if (parsed?.csvData && parsed?.filename) {
					decodeBase64AndDownload(parsed.csvData as string, parsed.filename as string);
					return;
				}

				downloadBlob(blob, filename);
			} catch (e) {
				console.error('Error processing CSV blob', e);
			}
		} else {
			const err = (action as any).payload || (action as any).error;
			console.error('Export failed', err);
		}
	} catch (err) {
		console.error('Error exporting CSV:', err);
	} finally {
		setIsExporting(false);
	}
};

export const handleChannelCSVExport = async (
	dispatch: AppDispatch,
	clanId: string,
	startStr: string,
	endStr: string,
	periodFilter: 'daily' | 'weekly' | 'monthly',
	selectedColumns: string[],
	setIsExporting: (value: boolean) => void,
	sortBy?: string,
	sort?: 'asc' | 'desc'
) => {
	try {
		setIsExporting(true);
		const action = await dispatch(
			exportChannelsCsv({ clanId, start: startStr, end: endStr, rangeType: periodFilter, columns: selectedColumns, sortBy, sort })
		);
		if (exportChannelsCsv.fulfilled.match(action)) {
			const payload = action.payload;

			// Response contains base64 CSV + filename
			if (payload?.csv_data && payload?.filename) {
				decodeBase64AndDownload(payload.csv_data as string, payload.filename as string);
				return;
			}

			if (payload?.csvData && payload?.filename) {
				decodeBase64AndDownload(payload.csvData as string, payload.filename as string);
			} else {
				console.error('No CSV data in export payload');
			}
		} else {
			const err = (action as any).payload || (action as any).error;
			console.error('Export failed', err);
		}
	} catch (err) {
		console.error('Error exporting CSV:', err);
	} finally {
		setIsExporting(false);
	}
};

export const handleUserCSVExport = async (
	dispatch: AppDispatch,
	clanId: string,
	startStr: string,
	endStr: string,
	periodFilter: 'daily' | 'weekly' | 'monthly',
	selectedColumns: string[],
	setIsExporting: (value: boolean) => void,
	sortBy?: string,
	sort?: 'asc' | 'desc'
) => {
	try {
		setIsExporting(true);
		const action = await dispatch(
			exportUsersCsv({ clanId, start: startStr, end: endStr, rangeType: periodFilter, columns: selectedColumns, sortBy, sort })
		);
		if (exportUsersCsv.fulfilled.match(action)) {
			const payload = action.payload;

			// Response contains base64 CSV + filename
			if (payload?.csv_data && payload?.filename) {
				decodeBase64AndDownload(payload.csv_data as string, payload.filename as string);
				return;
			}

			if (payload?.csvData && payload?.filename) {
				decodeBase64AndDownload(payload.csvData as string, payload.filename as string);
			} else {
				console.error('No CSV data in export payload');
			}
		} else {
			const err = (action as any).payload || (action as any).error;
			console.error('Export failed', err);
		}
	} catch (err) {
		console.error('Error exporting CSV:', err);
	} finally {
		setIsExporting(false);
	}
};
