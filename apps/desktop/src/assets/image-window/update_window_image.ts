import type { BrowserWindow } from 'electron';
import App from '../../app/app';
import { escapeHtml, sanitizeUrl } from '../../app/utils';
import type { ImageData } from './window_image';
import { listThumnails, scriptThumnails } from './window_image';

function updateImagePopup(imageData: ImageData, imageWindow: BrowserWindow) {
	const activeIndex = imageData.channelImagesData.selectedImageIndex;

	const time = escapeHtml(formatDateTime(imageData.create_time));
	const reversedImages = [...imageData.channelImagesData.images].reverse();
	const reversedIndexSelect = activeIndex >= 0 ? reversedImages.length - 1 - activeIndex : -1;
	const thumbnailsData = reversedImages.map((image) => ({
		id: escapeHtml(image.id || image.url || ''),
		url: sanitizeUrl(image.url),
		avatar: sanitizeUrl(image.uploaderData.avatar),
		name: escapeHtml(image.uploaderData.name),
		fileName: escapeHtml(image.filename),
		realUrl: sanitizeUrl(image.realUrl || ''),
		create_time: escapeHtml(formatDateTime(image.create_time_seconds || 0)),
		time: escapeHtml(formatDateTime(image.create_time_seconds || 0)),
		isVideo: image.isVideo,
		filetype: image.filetype,
		width: image.width || 600,
		height: image.height || 400
	}));
	const selectedItemId = reversedIndexSelect >= 0 && thumbnailsData[reversedIndexSelect] ? thumbnailsData[reversedIndexSelect].id : null;

	imageWindow.webContents.executeJavaScript(`
		var selectedImage = document.getElementById('selectedMedia');

		${App.imageScriptWindowLoaded === false ? `let currentIndex = ${activeIndex};` : `currentIndex =  ${activeIndex};`}
		(function() {
			// Use textContent for text content to prevent XSS
			const channelLabel = document.getElementById('channel-label');
			if (channelLabel) {
				channelLabel.textContent = ${JSON.stringify(imageData.channelImagesData.channelLabel)};
			}

			if (window.thumbnailVirtualizer) {
				const updateImagesData = ${JSON.stringify(thumbnailsData)};
				const newSelectedItemId = ${selectedItemId ? JSON.stringify(selectedItemId) : 'null'};
				const previousItemId = window.thumbnailVirtualizer.currentItemId || currentItemId;
				const isItemChanged = newSelectedItemId && newSelectedItemId !== previousItemId;

				imagesData = updateImagesData;

				window.thumbnailVirtualizer.update(
					updateImagesData,
					isItemChanged ? newSelectedItemId : undefined,
					undefined,
					undefined
				);

				const resolvedItemId = newSelectedItemId || window.thumbnailVirtualizer.currentItemId || currentItemId;
				if (resolvedItemId) {
					window.thumbnailVirtualizer.currentItemId = resolvedItemId;
					currentItemId = resolvedItemId;
					const resolvedIndex = window.thumbnailVirtualizer.findIndexById(resolvedItemId);
					if (resolvedIndex >= 0) {
						currentIndex = resolvedIndex;
					}

					if (isItemChanged && window.thumbnailVirtualizer.onThumbnailClick) {
						requestAnimationFrame(() => {
							window.thumbnailVirtualizer.onThumbnailClick(resolvedItemId);
							if (typeof updateNavigationButtons === 'function') {
								updateNavigationButtons();
							}
						});
					} else {
						if (typeof updateNavigationButtons === 'function') {
							updateNavigationButtons();
						}
					}
				} else {
					if (typeof updateNavigationButtons === 'function') {
						updateNavigationButtons();
					}
				}
			} else {
				const thumbnailsContent = document.getElementById('thumbnails-content');
				if (thumbnailsContent) {
					thumbnailsContent.innerHTML = ${JSON.stringify(listThumnails(imageData.channelImagesData.images, activeIndex))};
				}

				if (selectedImage) {
					selectedImage.src = ${JSON.stringify(sanitizeUrl(imageData.url))};
				}

				const userAvatar = document.getElementById('userAvatar');
				if (userAvatar) {
					userAvatar.src = ${JSON.stringify(sanitizeUrl(imageData.uploaderData.avatar))};
				}

				const username = document.getElementById('username');
				if (username) {
					username.textContent = ${JSON.stringify(imageData.uploaderData.name)};
				}

				const timestamp = document.getElementById('timestamp');
				if (timestamp) {
					timestamp.textContent = ${JSON.stringify(time)};
				}

				currentImageUrl = {
					fileName: ${JSON.stringify(escapeHtml(imageData.filename))},
					url: ${JSON.stringify(sanitizeUrl(imageData.url))},
					realUrl: ${JSON.stringify(sanitizeUrl(imageData.realUrl))}
				};
			}
		})();

		${App.imageScriptWindowLoaded === false ? scriptThumnails(reversedImages, activeIndex) : ''}
	`);

	imageWindow.webContents.executeJavaScript(`
		if (!window.thumbnailVirtualizer && !window.keyboardHandlerInitialized) {
			window.keyboardHandlerInitialized = true;
			window.sanitizeUrl = ${sanitizeUrl.toString()};
		}
	`);
	if (App.imageScriptWindowLoaded === false) {
		App.imageScriptWindowLoaded = true;
	}
	imageWindow.show();
	imageWindow.focus();
}

function formatDateTime(dateString: string | number) {
	return new Date(dateString).toLocaleString('vi-VN');
}
export default updateImagePopup;
