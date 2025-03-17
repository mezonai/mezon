import { BrowserWindow } from 'electron';
import App from '../../app/app';
import { escapeHtml, sanitizeUrl } from '../../app/utils';
import { ImageData, listThumnails, scriptThumnails } from './window_image';

function updateImagePopup(imageData: ImageData, imageWindow: BrowserWindow) {
	const activeIndex = imageData.channelImagesData.selectedImageIndex;
	const time = escapeHtml(formatDateTime(imageData.create_time));
	const uploaderData = imageData.channelImagesData.images.map((image, index) => {
		return JSON.stringify({
			name: image.uploaderData.name,
			avatar: image.uploaderData.avatar,
			create_item: escapeHtml(formatDateTime(image.create_time)),
			realUrl: image.realUrl,
			url: image.url,
			fileName: image.filename
		});
	});
	imageWindow.webContents.executeJavaScript(`
      document.getElementById('channel-label').innerHTML = '${escapeHtml(imageData.channelImagesData.channelLabel)}';
    	document.getElementById('thumbnails-content').innerHTML = '${listThumnails(imageData.channelImagesData.images, activeIndex)}';
      selectedImage.src = '${sanitizeUrl(imageData.url)}';
        document.querySelectorAll('.thumbnail').forEach(img => img.classList.remove('active'));
        document.getElementById('thumbnail-${activeIndex}')?.querySelector('.thumbnail').classList.add('active');
        document.getElementById('userAvatar').src = "${sanitizeUrl(imageData.uploaderData.avatar)}"
        document.getElementById('username').innerHTML  = "${escapeHtml(imageData.uploaderData.name)}"
        document.getElementById('timestamp').innerHTML  = "${escapeHtml(time)}"
        ${App.imageScriptWindowLoaded === false ? `let currentIndex = ${activeIndex};` : `currentIndex = ${activeIndex};`}
        currentImageUrl = {
        fileName : '${escapeHtml(imageData.filename)}',
        url : '${sanitizeUrl(imageData.url)}',
          realUrl : '${sanitizeUrl(imageData.realUrl)}'
      };
      ${scriptThumnails(imageData.channelImagesData.images, activeIndex)}
  `);

	imageWindow.webContents.executeJavaScript(`
      function handleKeydown(e){
    uploaderData = [${uploaderData}];

		switch (e.key) {
			case 'ArrowUp':
        case 'ArrowLeft':
          if(currentIndex > 0){
            document.querySelectorAll('.thumbnail').forEach(img => img.classList.remove('active'));
            currentIndex--;
            const prevThumb = document.querySelectorAll('.thumbnail')[currentIndex];
            prevThumb.classList.add('active');
            prevThumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
            selectedImage.src = sanitizeUrl(prevThumb.src);
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

        case 'ArrowDown':
        case 'ArrowRight':
          if(currentIndex < ${imageData.channelImagesData.images.length} - 1){
            document.querySelectorAll('.thumbnail').forEach(img => img.classList.remove('active'));
            currentIndex++;
            const nextThumb = document.querySelectorAll('.thumbnail')[currentIndex];
            nextThumb.classList.add('active');
            nextThumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
            selectedImage.src = sanitizeUrl(nextThumb.src);
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

function formatDateTime(dateString) {
	const options = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	};
	return new Date(dateString).toLocaleString('vi-VN');
}
export default updateImagePopup;
