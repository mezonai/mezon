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
	timeoutId.current && clearTimeout(timeoutId.current);
	element.classList.add('disable-hover');
	const removeHover = () => {
		element.classList.remove('disable-hover');
	};

	timeoutId.current = setTimeout(() => {
		requestAnimationFrame(removeHover);
	}, 300);
}
