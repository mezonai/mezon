export function deselectCurrent(): () => void {
	const selection = document.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return function noop() {
			return;
		};
	}

	let active = document.activeElement as HTMLElement | null;

	const ranges: Range[] = [];
	for (let i = 0; i < selection.rangeCount; i++) {
		const range = selection.getRangeAt(i);
		ranges.push(range);
	}

	switch (active?.tagName.toUpperCase()) {
		case 'INPUT':
		case 'TEXTAREA':
			(active as HTMLInputElement | HTMLTextAreaElement).blur();
			break;
		default:
			active = null;
			break;
	}

	selection.removeAllRanges();

	return () => {
		if (selection.type === 'Caret') {
			selection.removeAllRanges();
		}

		if (selection.rangeCount === 0) {
			ranges.forEach((range) => {
				selection.addRange(range);
			});
		}

		active?.focus();
	};
}
