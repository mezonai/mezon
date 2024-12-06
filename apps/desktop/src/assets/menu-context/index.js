class ContextMenu {
	constructor() {
		this.menu = null;
		this.currentTarget = null;
		this.init();
	}

	async init() {
		await this.createMenu();
		this.attachEventListeners();
	}

	async createMenu() {
		if (!document.getElementById('contextMenu')) {
			const response = await fetch('../menu-context/index.html');
			const html = await response.text();
			document.body.insertAdjacentHTML('beforeend', html);
		}
		this.menu = document.getElementById('contextMenu');
		if (!this.menu) {
			console.error('Failed to create or find context menu');
		}
	}

	attachEventListeners() {
		if (!this.menu) {
			console.error('Context menu not initialized');
			return;
		}

		document.addEventListener('click', () => this.hide());

		document.addEventListener('contextmenu', (e) => {
			if (e.target.matches('#selectedImage')) {
				e.preventDefault();
				this.currentTarget = e.target;
				this.show(e.pageX, e.pageY);
			}
		});

		this.menu.addEventListener('click', (e) => {
			e.stopPropagation();
			const action = e.target.closest('.menu-item')?.dataset.action;
			if (action) {
				this.handleAction(action);
			}
		});
	}

	show(x, y) {
		if (!this.menu) return;

		this.menu.style.left = `${x}px`;
		this.menu.style.top = `${y}px`;
		this.menu.classList.add('visible');

		// Adjust position if menu goes outside viewport
		const rect = this.menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		if (rect.right > viewportWidth) {
			this.menu.style.left = `${x - rect.width}px`;
		}
		if (rect.bottom > viewportHeight) {
			this.menu.style.top = `${y - rect.height}px`;
		}
	}

	hide() {
		if (!this.menu) return;
		this.menu.classList.remove('visible');
	}

	handleAction(action) {
		if (!this.currentTarget) return;

		switch (action) {
			case 'copyLink': {
				navigator.clipboard.writeText(this.currentTarget.src);
				break;
			}
			case 'openLink': {
				window.electron.shell.openExternal(this.currentTarget.src);
				break;
			}
			case 'copyImage': {
				const canvas = document.createElement('canvas');
				canvas.width = this.currentTarget.naturalWidth;
				canvas.height = this.currentTarget.naturalHeight;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(this.currentTarget, 0, 0);
				canvas.toBlob((blob) => {
					navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
				});
				break;
			}
			case 'saveImage': {
				const link = document.createElement('a');
				link.href = this.currentTarget.src;
				link.click();
				break;
			}
		}

		this.hide();
	}
}

// Initialize context menu
document.addEventListener('DOMContentLoaded', async () => {
	const contextMenu = new ContextMenu();
	await contextMenu.init();
});
