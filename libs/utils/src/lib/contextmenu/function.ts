export const convertImageToBlobFile = async (urlData: string): Promise<Blob | null> => {
	try {
		const response = await fetch(urlData);
		const blob = await response.blob();
		return blob;
	} catch (error) {
		console.error('Error converting image to blob:', error);
		return null;
	}
};

export const handleCopyImage = async (urlData: string) => {
	try {
		if (!navigator.clipboard?.write) {
			console.warn('Clipboard API not supported. Image data not copied.');
			return false;
		}

		const blob = await convertImageToBlobFile(urlData);
		if (!blob) {
			console.error('Failed to fetch or convert image');
			return false;
		}

		const fileName = urlData.split('/').pop()?.split('?')[0] || 'image';

		let fileType: string;
		if (blob.type) {
			fileType = blob.type.split('/')[1];
		} else {
			const mimeTypes: Record<string, string> = {
				jpg: 'jpeg',
				jpeg: 'jpeg',
				png: 'png',
				gif: 'gif',
				webp: 'webp',
				bmp: 'bmp'
			};

			const extension = fileName.split('.').pop()?.toLowerCase();
			fileType = mimeTypes[extension || ''] || 'png';
		}

		const file = new File([blob], fileName, {
			type: `image/${fileType}`
		});

		const clipboardItem = new ClipboardItem({
			[`image/${fileType}`]: file
		});

		await navigator.clipboard.write([clipboardItem]);
		return true;
	} catch (error) {
		console.error('Error handling image copy:', error);
		return false;
	}
};

export const handleSaveImage = (urlData: string) => {
	fetch(urlData)
		.then((response) => response.blob())
		.then((blob) => {
			const fileName = urlData.split('/').pop()?.split('?')[0] || 'image.png';
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
	window.open(urlData, '_blank');
};
