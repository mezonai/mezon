export function findParentByClass(element: HTMLElement, className: string): HTMLElement | null {
	let parent = element.parentElement;
	while (parent) {
		if (parent.classList.contains(className)) {
			return parent;
		}
		parent = parent.parentElement;
	}
	return null;
}

export function toggleDisableHover(element: HTMLDivElement | null, timeoutId: React.MutableRefObject<NodeJS.Timeout | null>) {
	if (!element) return;
	element.classList.add('disable-hover');
	timeoutId.current && clearTimeout(timeoutId.current);
	timeoutId.current = setTimeout(() => {
		element.classList.remove('disable-hover');
	}, 150);
}
