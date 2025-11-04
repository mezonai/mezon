import type { BrowserWindow } from 'electron';
import App from '../../app/app';
import { escapeHtml, sanitizeUrl } from '../../app/utils';
import type { ImageData } from './window_image';
import { listThumnails, scriptThumnails } from './window_image';

function updateImagePopup(imageData: ImageData, imageWindow: BrowserWindow) {
	const activeIndex = imageData.channelImagesData.selectedImageIndex;
	const time = escapeHtml(formatDateTime(imageData.create_time));
	const uploaderData = imageData.channelImagesData.images.map((image) => {
		return JSON.stringify({
			name: escapeHtml(image.uploaderData.name),
			avatar: sanitizeUrl(image.uploaderData.avatar),
			create_item: escapeHtml(formatDateTime(image.create_time)),
			realUrl: sanitizeUrl(image.realUrl),
			url: sanitizeUrl(image.url),
			fileName: escapeHtml(image.filename)
		});
	});

	const imagesData = JSON.stringify(
		imageData.channelImagesData.images.map((image) => ({
			url: sanitizeUrl(image.url),
			avatar: sanitizeUrl(image.uploaderData.avatar),
			name: escapeHtml(image.uploaderData.name),
			fileName: escapeHtml(image.filename),
			realUrl: sanitizeUrl(image.realUrl || ''),
			create_time: image.create_time,
			time: escapeHtml(formatDateTime(image.create_time))
		}))
	);

	// Use safer DOM manipulation instead of innerHTML injection
	imageWindow.webContents.executeJavaScript(`
		${App.imageScriptWindowLoaded === false ? `let currentIndex = ${activeIndex};` : `currentIndex =  ${activeIndex};`}
		(function() {
			// Use textContent for text content to prevent XSS
			const channelLabel = document.getElementById('channel-label');
			if (channelLabel) {
				channelLabel.textContent = ${JSON.stringify(imageData.channelImagesData.channelLabel)};
			}

			if (window.thumbnailVirtualizer) {
				const updateImagesData = ${imagesData};
				window.thumbnailVirtualizer.update(updateImagesData, ${activeIndex});
				currentIndex = ${activeIndex};
			} else {
				const thumbnailsContent = document.getElementById('thumbnails-content');
				if (thumbnailsContent) {
					thumbnailsContent.innerHTML = ${JSON.stringify(listThumnails(imageData.channelImagesData.images, activeIndex))};
				}
			}

			// Use safe property assignment for images
			const selectedImage = document.getElementById('selectedImage');
			if (selectedImage) {
				selectedImage.src = ${JSON.stringify(sanitizeUrl(imageData.url))};
			}

			// Use safe property assignment and textContent
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
		})();

		${App.imageScriptWindowLoaded === false ? scriptThumnails(imageData.channelImagesData.images, activeIndex) : ''}
	`);

	imageWindow.webContents.executeJavaScript(`
      function handleKeydown(e){
    uploaderData = [${uploaderData}];

		switch (e.key) {
			case 'ArrowDown':
        case 'ArrowRight':
          if(currentIndex > 0){
            // Reset transform when changing image
            resetTransform();
            currentIndex--;

            // Use virtualizer if available
            if (window.thumbnailVirtualizer) {
              window.thumbnailVirtualizer.scrollToIndex(currentIndex);
              window.thumbnailVirtualizer.render();
            }

            selectedImage.src = sanitizeUrl(uploaderData[currentIndex].url);
            document.getElementById('userAvatar').src = uploaderData[currentIndex].avatar;
            document.getElementById('username').innerHTML  = uploaderData[currentIndex].name;
            document.getElementById('timestamp').innerHTML  =  uploaderData[currentIndex].create_item;
            currentImageUrl = {
              fileName : uploaderData[currentIndex].fileName,
              url : uploaderData[currentIndex].url,
              realUrl : uploaderData[currentIndex].realUrl
            };
          }
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          if(currentIndex < ${imageData.channelImagesData.images.length} - 1){
            // Reset transform when changing image
            resetTransform();
            currentIndex++;

            if (window.thumbnailVirtualizer) {
              window.thumbnailVirtualizer.scrollToIndex(currentIndex);
              window.thumbnailVirtualizer.render();
            }

            selectedImage.src = sanitizeUrl(uploaderData[currentIndex].url);
            document.getElementById('userAvatar').src = uploaderData[currentIndex].avatar;
            document.getElementById('username').innerHTML  = uploaderData[currentIndex].name;
            document.getElementById('timestamp').innerHTML  =  uploaderData[currentIndex].create_item;
            currentImageUrl = {
              fileName : uploaderData[currentIndex].fileName,
              url : uploaderData[currentIndex].url,
              realUrl : uploaderData[currentIndex].realUrl
            };
          }
          break;
		}
	}

    ${
		App.imageScriptWindowLoaded === false &&
		`
      document.addEventListener('keydown', handleKeydown);
      window.sanitizeUrl = ${sanitizeUrl.toString()};
    `
	}
`);
	if (App.imageScriptWindowLoaded === false) {
		App.imageScriptWindowLoaded = true;
	}
	imageWindow.show();
	imageWindow.focus();
}

function formatDateTime(dateString: string) {
	return new Date(dateString).toLocaleString('vi-VN');
}
export default updateImagePopup;
