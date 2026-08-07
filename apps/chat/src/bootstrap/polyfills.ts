type IdleCallback = (deadline: IdleDeadline) => void;

const win = window as Window & {
	requestIdleCallback?: (cb: IdleCallback) => number;
	cancelIdleCallback?: (id: number) => void;
};

win.requestIdleCallback =
	win.requestIdleCallback ||
	function (cb: IdleCallback) {
		const start = Date.now();
		return window.setTimeout(() => {
			cb({
				didTimeout: false,
				timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
			});
		}, 1);
	};

win.cancelIdleCallback =
	win.cancelIdleCallback ||
	function (id: number) {
		clearTimeout(id);
	};

window.addEventListener('error', (e) => {
	if (/Loading chunk [\d]+ failed/.test(e.message)) {
		window.location.reload();
	}
});
