export class BadgeIconGenerator {
	private mainWindow: Electron.BrowserWindow;
	private MAX_WIN_COUNT = 9;
	constructor(mainWindow: Electron.BrowserWindow) {
		this.mainWindow = mainWindow;
	}

	generate(count: number | null): Promise<string> {
		const safeCount = typeof count === 'number' && Number.isFinite(count) ? count : 0;
		const small = safeCount > this.MAX_WIN_COUNT;
		const text = safeCount > this.MAX_WIN_COUNT ? '9+' : safeCount ? String(safeCount) : '•';
		return this.mainWindow.webContents.executeJavaScript(
			`window.drawBadge = function ${this.drawBadge}; window.drawBadge(${JSON.stringify(text)}, ${JSON.stringify(small)});`
		);
	}

	drawBadge(text: string, small: boolean) {
		const scale = window.devicePixelRatio || 1;
		const baseSize = small ? 16 : 20;
		const size = baseSize * scale;
		const canvas = document.createElement('canvas');
		canvas.setAttribute('width', `${size}`);
		canvas.setAttribute('height', `${size}`);
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return null;
		}

		ctx.scale(scale, scale);

		ctx.fillStyle = '#FF1744'; // Material Red A400
		ctx.beginPath();
		ctx.arc(size / (1.8 * scale), size / (1.8 * scale), size / (1.8 * scale), 0, Math.PI * 1.8);
		ctx.fill();
		const fontSize = small ? 8 : 10;
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = fontSize + 'px sans-serif';
		ctx.fillText(text, size / (2 * scale), size / (2 * scale), size / scale);

		return canvas.toDataURL();
	}
}
