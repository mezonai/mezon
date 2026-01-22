import { AppDispatch, exportClansCsv } from '@mezon/store';

export const handleCSVExport = async (
	dispatch: AppDispatch,
	startStr: string,
	endStr: string,
	periodFilter: 'daily' | 'weekly' | 'monthly',
	selectedColumns: string[],
	setIsExporting: (value: boolean) => void
) => {
	try {
		setIsExporting(true);
		const action = await dispatch(exportClansCsv({ start: startStr, end: endStr, rangeType: periodFilter, columns: selectedColumns }));
		if (exportClansCsv.fulfilled.match(action)) {
			const payload = action.payload as any;
			const blob = payload?.blob as Blob;
			const headersArr = payload?.headers as Array<[string, string]> | undefined;
			const contentDisp = (headersArr || []).find((h) => h[0].toLowerCase() === 'content-disposition')?.[1] || '';
			let filename = `clan_usage_${startStr}_to_${endStr}.csv`;
			const m = contentDisp.match(/filename\*?=(?:UTF-8'')?"?([^;"\n]+)"?/);
			if (m && m[1]) filename = decodeURIComponent(m[1]);

			const link = document.createElement('a');
			const blobUrl = URL.createObjectURL(blob);
			link.href = blobUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(blobUrl);
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
