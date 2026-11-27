export type EnterKeyAction = 'submit' | 'toggleHighlighted';

export function resolveEnterKeyAction(target: { tagName?: string; type?: string } | null, selectedCount: number): EnterKeyAction {
	if (selectedCount <= 0) {
		return 'toggleHighlighted';
	}

	const isSearchInput = target?.tagName?.toUpperCase() === 'INPUT' && target?.type === 'text';
	if (isSearchInput) {
		return 'toggleHighlighted';
	}

	return 'submit';
}
