async function copyBlobToClipboard(pngBlob: Blob | null): Promise<boolean> {
	if (!pngBlob || !(window.navigator.clipboard && window.ClipboardItem)) {
		return false;
	}

	try {
		await window.navigator.clipboard.write?.([
			new ClipboardItem({
				[pngBlob.type]: pngBlob
			})
		]);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

export const copyImageToClipboard = (imageUrl?: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		if (!imageUrl) {
			resolve(false);
			return;
		}

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const imageEl = new Image();
		imageEl.crossOrigin = 'anonymous';

		imageEl.onload = async (e: Event) => {
			if (ctx && e.currentTarget) {
				const img = e.currentTarget as HTMLImageElement;
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0, img.width, img.height);

				canvas.toBlob(
					async (blob) => {
						try {
							const success = await copyBlobToClipboard(blob);
							resolve(success);
						} catch (error) {
							reject(error);
						}
					},
					'image/png',
					1
				);
			} else {
				resolve(false);
			}
		};

		imageEl.onerror = () => {
			reject(new Error('Failed to load image'));
		};

		imageEl.src = imageUrl;
	});
};

export const handleCopyImage = async (urlData: string, onSuccess?: () => void): Promise<boolean> => {
	try {
		const success = await copyImageToClipboard(urlData);
		if (success && onSuccess) {
			onSuccess();
		}
		return success;
	} catch (error) {
		console.error('Error handling image copy:', error);
		return false;
	}
};

export const handleSaveImage = (urlData: string) => {
	try {
		const parsed = new URL(urlData);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'blob:' && parsed.protocol !== 'data:') {
			console.error('Invalid URL:', urlData);
			return;
		}
		
	} catch {
		console.error('Error parsing URL:', urlData);
		return;
	}
	fetch(urlData)
		.then((response) => response.blob())
		.then((blob) => {
			const rawName = urlData.split('/').pop()?.split('?')[0] || 'image.png';
			const fileName = rawName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 255) || 'image.png';
			const url = window.URL.createObjectURL(new Blob([blob]));
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		})
		.catch((error) => console.error('Error downloading image:', error));
};

export const handleCopyLink = (urlData: string) => {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(urlData).catch((error) => {
			console.error('Failed to copy link:', error);
		});
	} else {
		console.warn('Clipboard API not supported. Link not copied.');
	}
};

export const handleOpenLink = (urlData: string) => {
	try {
		const parsed = new URL(urlData);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'mailto:') {
			return;
		}
	} catch {
		return;
	}
	window.open(urlData, '_blank', 'noopener,noreferrer');
};
