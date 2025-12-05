import { BrowserWindow, ipcMain } from 'electron';
import type { ApiChannelAttachment } from 'mezon-js/api.gen';
import { join } from 'path';
import App from '../../app/app';
import { escapeHtml, sanitizeUrl } from '../../app/utils';
import menu from '../menu-context';
import image_window_css from './image-window-css';

function createImgProxyUrl(sourceImageUrl: string, width = 0, height = 0, resizeType = 'force'): string {
	if (!sourceImageUrl) return '';

	const sanitizedUrl = sanitizeUrl(sourceImageUrl);
	if (!sanitizedUrl) return '';

	const base = process.env.NX_IMGPROXY_BASE_URL || 'https://imgproxy.mezon.ai';
	const key = process.env.NX_IMGPROXY_KEY || 'K0YUZRIosDOcz5lY6qrgC6UIXmQgWzLjZv7VJ1RAA8c';
	if (!base || !key) return sanitizedUrl;

	const processingOptions = `rs:${resizeType}:${width}:${height}:1/mb:2097152`;
	const path = `/${processingOptions}/plain/${sanitizedUrl}@webp`;
	return `${base}/${key}${path}`;
}

interface IAttachmentEntity extends ApiChannelAttachment {
	id: string;
	channelId?: string;
	clanId?: string;
	isVideo?: boolean;
}
interface IAttachmentEntityWithUploader extends IAttachmentEntity {
	uploaderData: {
		avatar: string;
		name: string;
	};
	realUrl: string;
	isVideo?: boolean;
}
interface IImageWindowProps {
	channelLabel: string;
	selectedImageIndex: number;
	images: Array<IAttachmentEntityWithUploader>;
}
export type ImageData = {
	filename: string;
	size: number;
	url: string;
	filetype: string;
	width: number;
	height: number;
	sender_id: string;
	create_time: string;
	uploaderData: {
		name: string;
		avatar: string;
	};
	realUrl: string;
	channelImagesData: IImageWindowProps;
	isVideo?: boolean;
};
function openImagePopup(imageData: ImageData, parentWindow: BrowserWindow = App.mainWindow, params?: Record<string, string>) {
	const parentBounds = parentWindow.getBounds();
	const activeIndex = imageData.channelImagesData.selectedImageIndex;
	const width = Math.floor(parentBounds.width * 1.0);
	const height = Math.floor(parentBounds.height * 1.0);
	const x = Math.floor(parentBounds.x + (parentBounds.width - width) / 2);
	const y = Math.floor(parentBounds.y + (parentBounds.height - height) / 2);
	const popupWindow = new BrowserWindow({
		width,
		height,
		x,
		y,
		frame: false,
		transparent: true,
		show: false,
		backgroundColor: '#00000000',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: join(__dirname, 'main.preload.js')
		},
		minWidth: 200,
		minHeight: 200,
		resizable: true,
		movable: true,
		hasShadow: true
	});
	const imageViewerHtml = `
     <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Viewer</title>
  <link rel="stylesheet" href="image-window.css">
  <link rel="stylesheet" href="../menu-context/index.css">
  <style>
    ${image_window_css}
  </style>
  <script>
  function closeWindow() {
    const media = document.getElementById('selectedMedia');
    if (media) {
      if (media.tagName === 'VIDEO') {
        media.pause();
        media.src = '';
      } else {
        media.src = null;
      }
    }
    window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_IMAGE_WINDOW');
  }
</script>
</head>
<body>
<div class="window-wrapper">
<div class="title-bar">
  <div class="app-title">Mezon</div>
  <div class="functional-bar">
    <div id="minimize-window" class="function-button">
   <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-button">
        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div id="maximize-window" class="function-button">
      <svg viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-button zoom-button">
        <path
          d="M384 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l320 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div id="close-window" class="function-button" onclick="closeWindow()">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-button">
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          {' '}
          <path
            d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"
            fill="currentColor"
          ></path>{' '}
        </g>
      </svg>
    </div>
  </div>
</div>
<div class="main-container">
  <div id="channel-label" class="channel-label">${escapeHtml(imageData.channelImagesData.channelLabel)}</div>
  <div class="image-view">
    <div class="selected-image-wrapper" id="selected-image-wrapper">
      <div id="skeleton-main" class="skeleton skeleton-main" style="width: ${imageData.width}px; height: ${imageData.height}px; max-width: 100%; max-height: 100%;">
        <svg class="skeleton-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/>
        </svg>
      </div>
      <div class="navigation-buttons">
        <button class="nav-button" id="prevImageBtn" title="Previous image (↑)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="nav-button" id="nextImageBtn" title="Next image (↓)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      ${
			imageData.isVideo || imageData.filetype?.startsWith('video') || imageData.filetype?.includes('mp4') || imageData.filetype?.includes('mov')
				? `<video id="selectedMedia" class="selected-image" src="${sanitizeUrl(imageData.realUrl || imageData.url)}" controls autoplay style="max-width: 100%; max-height: 100%; object-fit: contain;"></video>`
				: `<img id="selectedMedia" class="selected-image image-loading" src="${createImgProxyUrl(imageData.url)}" />`
		}
    </div>
    <div id="thumbnails" class="thumbnail-container">
      <div id="thumbnails-content" class="thumbnails-content">
      ${listThumnails(imageData.channelImagesData.images, activeIndex)}
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <div class="sender-info">
      <img id="userAvatar" src="${sanitizeUrl(imageData.uploaderData.avatar)}" class="user-avatar" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover">
      <div>
        <div id="username" class="username" style="font-weight: bold;">${escapeHtml(imageData.uploaderData.name)}</div>
        <div id="timestamp" class="timestamp" style="font-size: 0.8em; color: #ccc;">${escapeHtml(formatDateTime(imageData.create_time))}</div>
      </div>
    </div>
    <div class="image-controls">
      <button class="control-button" id="downloadBtn">
        <svg width="24" height="24" viewBox="0 0 24 24" class="icon-2tQ9Jt">
          <g fill="currentColor">
            <path d="M17.707 10.708L16.293 9.29398L13 12.587V2.00098H11V12.587L7.70697 9.29398L6.29297 10.708L12 16.415L17.707 10.708Z"></path>
            <path d="M18 18.001V20.001H6V18.001H4V20.001C4 21.103 4.897 22.001 6 22.001H18C19.104 22.001 20 21.103 20 20.001V18.001H18Z"></path>
          </g>
        </svg>
      </button>
      <div class="divider"></div>
      <button class="control-button" id="rotateLeftBtn">
       <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.51018 14.9907C4.15862 16.831 5.38765 18.4108 7.01208 19.492C8.63652 20.5732 10.5684 21.0972 12.5165 20.9851C14.4647 20.873 16.3237 20.1308 17.8133 18.8704C19.303 17.61 20.3426 15.8996 20.7756 13.997C21.2086 12.0944 21.0115 10.1026 20.214 8.32177C19.4165 6.54091 18.0617 5.06746 16.3539 4.12343C14.6461 3.17941 12.6777 2.81593 10.7454 3.08779C7.48292 3.54676 5.32746 5.91142 3 8M3 8V2M3 8H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </button>
      <button class="control-button" id="rotateRightBtn">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.4898 14.9907C19.8414 16.831 18.6124 18.4108 16.9879 19.492C15.3635 20.5732 13.4316 21.0972 11.4835 20.9851C9.5353 20.873 7.67634 20.1308 6.18668 18.8704C4.69703 17.61 3.65738 15.8996 3.22438 13.997C2.79138 12.0944 2.98849 10.1026 3.78602 8.32177C4.58354 6.54091 5.93827 5.06746 7.64608 4.12343C9.35389 3.17941 11.3223 2.81593 13.2546 3.08779C16.5171 3.54676 18.6725 5.91142 21 8M21 8V2M21 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </button>
      <div class="divider"></div>
      <button class="control-button" id="zoomInBtn">
       <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z" fill="currentColor"></path>
          <path fillRule="evenodd" clipRule="evenodd" d="M10 14C10 14.5523 10.4477 15 11 15C11.5523 15 12 14.5523 12 14V12H14C14.5523 12 15 11.5523 15 11C15 10.4477 14.5523 10 14 10H12V8C12 7.44772 11.5523 7 11 7C10.4477 7 10 7.44772 10 8V10H8C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12H10V14Z" fill="currentColor"></path>
        </svg>
      </button>
      <button class="control-button" id="zoomOutBtn">
         <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z" fill="#ffffff"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M7 11C7 10.4477 7.44772 10 8 10H14C14.5523 10 15 10.4477 15 11C15 11.5523 14.5523 12 14 12H8C7.44772 12 7 11.5523 7 11Z" fill="#ffffff"/>
          </svg>
      </button>
    </div>
    <div class="toggle-list">
      <button class="control-button" id="toggleListBtn">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            {' '}
            <g id="System / Bar_Right">
              {' '}
              <path
                id="Vector"
                d="M15 4L15 20M15 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002V16.8002C4 17.9203 4 18.4796 4.21799 18.9074C4.40973 19.2837 4.71547 19.5905 5.0918 19.7822C5.51921 20 6.07901 20 7.19694 20L15 20M15 4H16.8002C17.9203 4 18.4796 4 18.9074 4.21799C19.2837 4.40973 19.5905 4.71547 19.7822 5.0918C20 5.5192 20 6.079 20 7.19691L20 16.8031C20 17.921 20 18.48 19.7822 18.9074C19.5905 19.2837 19.2837 19.5905 18.9074 19.7822C18.48 20 17.921 20 16.8031 20H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>{' '}
            </g>{' '}
          </g>
        </svg>
      </button>
    </div>
  </div>
  <div id="toast" class="toast">Copied to clipboard</div>
</div>
</div>
</body>
</html>
  `;
	popupWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(imageViewerHtml)}`);
	popupWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
		console.error(`Image viewer failed to load: ${validatedURL}, Error: ${errorCode} - ${errorDescription}`);
	});
	popupWindow.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
		if (message.includes('ERR_NAME_NOT_RESOLVED') || message.includes('net::ERR_')) {
			console.error(`Image viewer network error: ${message} at ${sourceId}:${line}`);
		}
	});
	ipcMain.removeHandler('minimize-window');
	ipcMain.handle('minimize-window', () => {
		popupWindow.minimize();
	});
	ipcMain.removeHandler('maximize-window');
	ipcMain.handle('maximize-window', () => {
		if (popupWindow.isMaximized()) {
			popupWindow.unmaximize();
		} else {
			popupWindow.maximize();
		}
	});
	popupWindow.once('ready-to-show', () => {
		popupWindow.show();
		popupWindow.webContents.executeJavaScript(`
	    const selectedMedia = document.getElementById('selectedMedia');
      const isVideo = selectedMedia && selectedMedia.tagName === 'VIDEO';
      const skeletonMain = document.getElementById('skeleton-main');
      let skeletonTimer = null;

      const handleMediaLoaded = () => {
        if (skeletonTimer) {
          clearTimeout(skeletonTimer);
          skeletonTimer = null;
        }
        if (skeletonMain) {
          skeletonMain.classList.remove('visible');
          setTimeout(() => {
            skeletonMain.style.display = 'none';
          }, 300);
        }
        const currentMedia = document.getElementById('selectedMedia');
        if (currentMedia) {
          currentMedia.classList.remove('image-loading');
          currentMedia.classList.add('image-loaded');
        }
      };

      const handleMediaError = () => {
        if (skeletonTimer) {
          clearTimeout(skeletonTimer);
          skeletonTimer = null;
        }
        if (skeletonMain) {
          skeletonMain.classList.remove('visible');
          skeletonMain.style.display = 'none';
        }
        const currentMedia = document.getElementById('selectedMedia');
        if (currentMedia) {
          currentMedia.style.display = 'none';
        }

        const wrapper = document.getElementById('selected-image-wrapper');
        if (wrapper) {
          const existingError = wrapper.querySelector('.image-error');
          if (!existingError) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'image-error';
            errorDiv.innerHTML = '<svg class="image-error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19Z" stroke="currentColor" stroke-width="2"/><path d="M3 16L8 11L13 16M16 14L19 11L21 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/></svg><div class="image-error-text">Failed to load media</div>';
            wrapper.insertBefore(errorDiv, wrapper.querySelector('.navigation-buttons'));
          }
        }
      };

      const handleMediaLoading = (forceForImage = false) => {
        if (skeletonTimer) {
          clearTimeout(skeletonTimer);
        }
        const currentMedia = document.getElementById('selectedMedia');
        const currentIsVideo = currentMedia && currentMedia.tagName === 'VIDEO';
        const shouldShowSkeleton = forceForImage || !currentIsVideo;

        if (shouldShowSkeleton) {
          skeletonTimer = setTimeout(() => {
            if (skeletonMain) {
              skeletonMain.style.display = 'flex';
              requestAnimationFrame(() => {
                skeletonMain.classList.add('visible');
              });
            }
          }, 300);

          if (currentMedia) {
            currentMedia.classList.add('image-loading');
            currentMedia.classList.remove('image-loaded');
          }
        }
      };

      if (!isVideo) {
        handleMediaLoading();
      }

      if (selectedMedia) {
        if (isVideo) {
          selectedMedia.addEventListener('loadeddata', handleMediaLoaded);
          selectedMedia.addEventListener('error', handleMediaError);
          if (selectedMedia.readyState >= 2) {
            handleMediaLoaded();
          }
        } else {
          if (selectedMedia.complete && selectedMedia.naturalHeight !== 0) {
            handleMediaLoaded();
          } else {
            selectedMedia.addEventListener('load', handleMediaLoaded);
            selectedMedia.addEventListener('error', handleMediaError);
          }
        }
      }

      let currentImageUrl = {
        fileName : ${JSON.stringify(imageData.filename || '')},
        url : ${JSON.stringify(imageData.url || '')},
          realUrl : ${JSON.stringify(imageData.realUrl || '')},
          isVideo : ${imageData.isVideo || false}
      };
      let uploaderData = [];
      document.getElementById('close-window').addEventListener('click', () => {
		if (selectedMedia) {
			if (isVideo) {
				selectedMedia.pause();
				selectedMedia.src = '';
			} else {
				selectedMedia.src = null;
			}
		}
    	window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_IMAGE_WINDOW');
	});
	document.getElementById('minimize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MINIMIZE_WINDOW');
	});
  document.getElementById('channel-label').textContent = '${imageData.channelImagesData.channelLabel}';
	document.getElementById('maximize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MAXIMIZE_WINDOW');
	});
 document.getElementById('downloadBtn').addEventListener('click', () => {
window.electron.handleActionShowImage('saveImage',currentImageUrl.realUrl);
});
  document.getElementById('toggleListBtn').addEventListener('click', () => {
  if(document.getElementById('thumbnails').classList.contains('thumbnail-contain-hide')){
  document.getElementById('thumbnails').classList.remove('thumbnail-contain-hide');
  return;
  }
  document.getElementById('thumbnails').classList.add('thumbnail-contain-hide');
  });
  document.getElementById('selected-image-wrapper').addEventListener('click', (e)=>{
      window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_IMAGE_WINDOW');
})
document.getElementById('selectedMedia').addEventListener('click', (e)=>{
     e.stopPropagation();
})
document.addEventListener('keydown', (e) => {
		switch (e.key) {
			case 'Escape':
				if (selectedMedia) {
					if (isVideo) {
						selectedMedia.pause();
						selectedMedia.src = '';
					} else {
						selectedMedia.src = null;
					}
				}
    	  window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_IMAGE_WINDOW');
				break;
		}
	});

	const prevImageBtn = document.getElementById('prevImageBtn');
	const nextImageBtn = document.getElementById('nextImageBtn');
	const navigationButtons = document.querySelector('.navigation-buttons');

	if (navigationButtons) {
		navigationButtons.addEventListener('click', (e) => {
			e.stopPropagation();
		});
	}

	if (prevImageBtn) {
		prevImageBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
			document.dispatchEvent(event);
		});
	}

	if (nextImageBtn) {
		nextImageBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
			document.dispatchEvent(event);
		});
	}
      ${scriptRotateAndZoom()}
      ${scriptDrag()}
      document.body.insertAdjacentHTML('beforeend', '${menu}');
		  const menu = document.getElementById('contextMenu');
      document.body.addEventListener('click',()=>{
				menu.classList.remove('visible');
      })
      ${scriptMenu()}
      `);
	});
	popupWindow.on('closed', () => {
		ipcMain.removeHandler('minimize-window');
		ipcMain.removeHandler('maximize-window');
		App.imageViewerWindow = null;
		App.imageScriptWindowLoaded = false;
	});
	App.imageViewerWindow = popupWindow;
	return popupWindow;
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
const createThumbProxyUrlScript = () => {
	const base = process.env.NX_IMGPROXY_BASE_URL || 'https://imgproxy.mezon.ai';
	const key = process.env.NX_IMGPROXY_KEY || 'K0YUZRIosDOcz5lY6qrgC6UIXmQgWzLjZv7VJ1RAA8c';

	return `
		const sanitizeImageUrl = (url) => {
			if (!url) return '';
			try {
				const decodedUrl = decodeURIComponent(url);
				const encodedUrl = encodeURI(decodedUrl);
				const parsed = new URL(encodedUrl);
				if (!['http:', 'https:', 'data:'].includes(parsed.protocol)) {
					return '';
				}
				if (parsed.protocol === 'data:' && !encodedUrl.startsWith('data:image/')) {
					return '';
				}
				return encodedUrl.replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			} catch (e) {
				return '';
			}
		};

		const createThumbProxyUrl = (sourceImageUrl) => {
			if (!sourceImageUrl) return '';
			if (!sourceImageUrl?.startsWith('https://cdn.mezon') && !sourceImageUrl?.startsWith('https://profile.mezon')) {
				return sourceImageUrl;
			}
			const sanitized = sanitizeImageUrl(sourceImageUrl);
			if (!sanitized) return '';
			const width = 88;
			const height = 88;
			const resizeType = 'fit';
			const processingOptions = 'rs:' + resizeType + ':' + width + ':' + height + ':1/mb:2097152';
			const path = '/' + processingOptions + '/plain/' + sanitized + '@webp';
			const base = ${JSON.stringify(base)};
			const key = ${JSON.stringify(key)};
			if (!base || !key) return sanitized;
			return base + '/' + key + path;
		};

		const createImageProxyUrl = (sourceImageUrl) => {
			if (!sourceImageUrl) return '';
			if (!sourceImageUrl?.startsWith('https://cdn.mezon') && !sourceImageUrl?.startsWith('https://profile.mezon')) {
				return sourceImageUrl;
			}
			const sanitized = sanitizeImageUrl(sourceImageUrl);
			if (!sanitized) return '';
			const width = 0;
			const height = 0;
			const resizeType = 'force';
			const processingOptions = 'rs:' + resizeType + ':' + width + ':' + height + ':1/mb:2097152';
			const path = '/' + processingOptions + '/plain/' + sanitized + '@webp';
			const base = ${JSON.stringify(base)};
			const key = ${JSON.stringify(key)};
			if (!base || !key) return sanitized;
			return base + '/' + key + path;
		};
	`;
};
const createVirtualizer = () => {
	return `
		const debounce = (fn, ms) => {
			let timeoutId;
			return function(...args) {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => fn.apply(this, args), ms);
			};
		};
		const approxEqual = (a, b) => Math.abs(a - b) < 1;
		const getRect = (element) => {
			const { offsetWidth, offsetHeight } = element;
			return { width: offsetWidth, height: offsetHeight };
		};
		class ThumbnailVirtualizer {
			constructor(container, items, options = {}) {
				this.container = container;
				this.items = items;
				this.baseItemHeight = 88;
				this.dateLabelHeight = 27;
				this.overscan = options.overscan || 3;
				this.scrollTop = 0;
				this.containerHeight = 0;
				this.visibleRange = { start: 0, end: 0 };
				this.isLoadingBefore = false;
				this.isLoadingAfter = false;
				this.hasMoreBefore = true;
				this.hasMoreAfter = true;
				this.loadMoreThreshold = 5;
				this.renderedItems = new Map();
				this.itemHeights = new Map();
				this._cumulativePositions = new Map();
				this.currentItemId = null;
				this.savedScrollHeight = 0;
				this.savedScrollTop = 0;
				this.isScrolling = false;
				this.scrollDirection = null;
				this.useAnimationFrame = options.useAnimationFrame ?? true;
				this.init();
			}
			getItemHeight(index) {
				if (this.itemHeights.has(index)) {
					return this.itemHeights.get(index);
				}
				const item = this.items[index];
				if (!item) return this.baseItemHeight;
				const currentDate = this.formatDate(item.create_time);
				const nextItem = this.items[index - 1];
				const nextDate = nextItem ? this.formatDate(nextItem.create_time) : null;
				const hasDateLabel = currentDate !== nextDate;
				const height = hasDateLabel ? this.baseItemHeight + this.dateLabelHeight : this.baseItemHeight;
				this.itemHeights.set(index, height);
				return height;
			}
			calculateHeights() {
				let total = 0;
				let cumulative = 0;
				this.itemHeights.clear();
				this._cumulativePositions = new Map();
				this._cumulativePositions.set(0, 0);
				for (let i = 0; i < this.items.length; i++) {
					const height = this.getItemHeight(i);
					this.itemHeights.set(i, height);
					this._cumulativePositions.set(i, cumulative);
					cumulative += height;
					total += height;
				}
				return total;
			}
			getItemStart(index) {
				if (this._cumulativePositions && this._cumulativePositions.has(index)) {
					return this._cumulativePositions.get(index);
				}
				let start = 0;
				for (let i = 0; i < index; i++) {
					start += this.getItemHeight(i);
				}
				return start;
			}
			init() {
				this.containerHeight = this.container.clientHeight;
				this.totalHeight = this.calculateHeights();
				this.content = document.createElement('div');
				this.content.style.position = 'relative';
				this.content.style.height = this.totalHeight + 'px';
				this.container.appendChild(this.content);
				this.debouncedCheckLoadMore = debounce(() => this.checkLoadMore(), 150);
				this.debouncedScrollEnd = debounce(() => {
					this.isScrolling = false;
					this.scrollDirection = null;
				}, 150);
				this.container.addEventListener('scroll', () => this.handleScroll());
				if (typeof ResizeObserver !== 'undefined') {
					this.resizeObserver = new ResizeObserver((entries) => {
						const run = () => {
							const entry = entries[0];
							let newHeight;
							if (entry?.borderBoxSize) {
								const box = entry.borderBoxSize[0];
								if (box) {
									newHeight = box.blockSize;
								}
							}
							if (!newHeight) {
								const rect = getRect(this.container);
								newHeight = rect.height;
							}
							if (Math.abs(newHeight - this.containerHeight) > 1) {
								this.containerHeight = newHeight;
								this.render();
							}
						};
						this.useAnimationFrame ? requestAnimationFrame(run) : run();
					});
					this.resizeObserver.observe(this.container, { box: 'border-box' });
					this.itemResizeObserver = new ResizeObserver((entries) => {
						const run = () => {
							entries.forEach((entry) => {
								const element = entry.target;
								const indexAttr = element.getAttribute('data-index');
								if (indexAttr !== null) {
									const index = parseInt(indexAttr, 10);
									if (!isNaN(index) && index >= 0) {
										this.measureItem(index, element);
									}
								}
							});
						};
						this.useAnimationFrame ? requestAnimationFrame(run) : run();
					});
				}
				this.render();
			}
			measureItem(index, element) {
				if (!element || !element.isConnected) return;
				const actualHeight = element.offsetHeight;
				const cachedHeight = this.itemHeights.get(index);
				if (Math.abs(actualHeight - (cachedHeight || 0)) > 1) {
					this.itemHeights.set(index, actualHeight);
					this.totalHeight = this.calculateHeights();
					this.content.style.height = this.totalHeight + 'px';
					this.visibleRange = { start: -1, end: -1 };
					this.render();
				}
			}
			handleScroll() {
				const currentScrollTop = this.container.scrollTop;
				if (!approxEqual(currentScrollTop, this.previousScrollTop)) {
					this.isScrolling = true;
					this.scrollDirection = currentScrollTop > this.previousScrollTop ? 'forward' : 'backward';
					this.previousScrollTop = currentScrollTop;
				}
				this.scrollTop = currentScrollTop;
				this.render();
				this.debouncedCheckLoadMore();
				this.debouncedScrollEnd();
			}
			checkLoadMore() {
				if (!this.onLoadMore || this.isLoadingBefore || this.isLoadingAfter) return;
				const range = this.calculateVisibleRange();
				if (range.start < 0 || range.end < 0) return;
				if (this.hasMoreBefore && range.start <= this.loadMoreThreshold) {
					this.isLoadingBefore = true;
					if (this.container) {
						this.savedScrollHeight = this.container.scrollHeight;
						this.savedScrollTop = this.container.scrollTop;
					}
					this.onLoadMore('before');
					return;
				}
				if (this.hasMoreAfter && range.end >= this.items.length - 1 - this.loadMoreThreshold) {
					this.isLoadingAfter = true;
					this.onLoadMore('after');
				}
			}
			calculateVisibleRange() {
				let start = 0;
				let end = this.items.length - 1;
				let left = 0;
				let right = this.items.length - 1;
				while (left <= right) {
					const mid = Math.floor((left + right) / 2);
					const itemStart = this.getItemStart(mid);
					const itemHeight = this.getItemHeight(mid);
					if (itemStart + itemHeight < this.scrollTop) {
						left = mid + 1;
					} else {
						start = mid;
						right = mid - 1;
					}
				}
				start = Math.max(0, start - this.overscan);
				const scrollBottom = this.scrollTop + this.containerHeight;
				left = start;
				right = this.items.length - 1;
				while (left <= right) {
					const mid = Math.floor((left + right) / 2);
					const itemStart = this.getItemStart(mid);
					if (itemStart <= scrollBottom) {
						end = mid;
						left = mid + 1;
					} else {
						right = mid - 1;
					}
				}
				end = Math.min(this.items.length - 1, end + this.overscan);
				return { start, end };
			}
			render() {
				const range = this.calculateVisibleRange();
				if (range.start === this.visibleRange.start && range.end === this.visibleRange.end) {
					this.updateItemPositions();
					this.updateActiveState(this.currentItemId);
					return;
				}
				this.visibleRange = range;
				const itemsToRemove = [];
				this.renderedItems.forEach((element, index) => {
					if (index < range.start || index > range.end) {
						if (this.itemResizeObserver) {
							this.itemResizeObserver.unobserve(element);
						}
						element.remove();
						itemsToRemove.push(index);
					}
				});
				itemsToRemove.forEach(index => this.renderedItems.delete(index));
				this.renderedItems.forEach((element, index) => {
					if (element && element.isConnected) {
						element.style.top = this.getItemStart(index) + 'px';
					}
				});
				for (let i = range.start; i <= range.end; i++) {
					if (this.renderedItems.has(i)) {
						const existingElement = this.renderedItems.get(i);
						if (existingElement && existingElement.isConnected) {
							existingElement.style.top = this.getItemStart(i) + 'px';
						}
						continue;
					}
					const item = this.items[i];
					if (!item) continue;
					const index = i;
					const itemId = item.id || item.url;
					const wrapper = document.createElement('div');
					wrapper.className = 'thumbnail-wrapper';
					wrapper.id = 'thumbnail-' + itemId;
					wrapper.style.position = 'absolute';
					wrapper.style.top = this.getItemStart(i) + 'px';
					const currentDate = this.formatDate(item.create_time);
					const nextItem = this.items[i - 1];
					const nextDate = nextItem ? this.formatDate(nextItem.create_time) : null;
					const hasDateLabel = currentDate !== nextDate;
					if (hasDateLabel) {
						const dateLabel = document.createElement('div');
						dateLabel.className = 'date-label';
						dateLabel.textContent = currentDate;
						wrapper.appendChild(dateLabel);
					}
					const isVideoThumbnail = item.isVideo || item.filetype?.startsWith('video') || item.filetype?.includes('mp4') || item.filetype?.includes('mov');
					const currentIndex = this.findIndexById(this.currentItemId);

					const skeleton = document.createElement('div');
					skeleton.className = 'skeleton skeleton-thumbnail';
					skeleton.innerHTML = '<svg class="skeleton-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/></svg>';
					wrapper.appendChild(skeleton);

					if (isVideoThumbnail) {
						const video = document.createElement('video');
						video.className = 'thumbnail image-loading';
						if (index === currentIndex && currentIndex >= 0) {
							video.classList.add('active');
						}
						const videoUrl = sanitizeImageUrl(item.realUrl || item.url);
						if (videoUrl) {
							video.src = videoUrl;
						}
						video.muted = true;
						video.playsInline = true;
						video.preload = 'metadata';
						video.style.objectFit = 'cover';
						video.setAttribute('data-index', index);
						video.setAttribute('data-id', itemId);
						video.addEventListener('click', (e) => {
							const itemId = e.target.getAttribute('data-id');
							this.onThumbnailClick(itemId);
						});
						video.addEventListener('loadeddata', () => {
							skeleton.style.display = 'none';
							video.classList.remove('image-loading');
							video.classList.add('image-loaded');
						});
						video.addEventListener('error', () => {
							skeleton.style.display = 'none';
							video.style.display = 'none';
							const errorDiv = document.createElement('div');
							errorDiv.className = 'thumbnail-error';
							errorDiv.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19Z" stroke="currentColor" stroke-width="2"/><path d="M3 16L8 11L13 16M16 14L19 11L21 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/></svg>';
							errorDiv.setAttribute('data-id', itemId);
							errorDiv.addEventListener('click', (e) => {
								const itemId = e.currentTarget.getAttribute('data-id');
								this.onThumbnailClick(itemId);
							});
							wrapper.appendChild(errorDiv);
						});
						wrapper.appendChild(video);

						const playIcon = document.createElement('div');
						playIcon.className = 'video-play-icon';
						playIcon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"><circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.6)" /><path d="M9.5 8.5 L16.5 12 L9.5 15.5 Z" fill="white" /></svg>';
						playIcon.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 1;';
						wrapper.appendChild(playIcon);
					} else {
						const img = document.createElement('img');
						img.className = 'thumbnail image-loading';
						if (index === currentIndex && currentIndex >= 0) {
							img.classList.add('active');
						}
						img.src = createThumbProxyUrl(item.url);
						img.alt = item.fileName || '';
						img.setAttribute('data-index', index);
						img.setAttribute('data-id', itemId);
						img.addEventListener('click', (e) => {
							const itemId = e.target.getAttribute('data-id');
							this.onThumbnailClick(itemId);
						});
						img.addEventListener('load', () => {
							skeleton.style.display = 'none';
							img.classList.remove('image-loading');
							img.classList.add('image-loaded');
						});
						img.addEventListener('error', () => {
							skeleton.style.display = 'none';
							img.style.display = 'none';
							const errorDiv = document.createElement('div');
							errorDiv.className = 'thumbnail-error';
							errorDiv.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19Z" stroke="currentColor" stroke-width="2"/><path d="M3 16L8 11L13 16M16 14L19 11L21 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/></svg>';
							errorDiv.setAttribute('data-id', itemId);
							errorDiv.addEventListener('click', (e) => {
								const itemId = e.currentTarget.getAttribute('data-id');
								this.onThumbnailClick(itemId);
							});
							if (index === currentIndex && currentIndex >= 0) {
								errorDiv.classList.add('active');
							}
							wrapper.appendChild(errorDiv);
						});
						wrapper.appendChild(img);
					}

					this.content.appendChild(wrapper);
					wrapper.setAttribute('data-index', index.toString());
					if (this.itemResizeObserver) {
						this.itemResizeObserver.observe(wrapper);
					}
					requestAnimationFrame(() => {
						if (wrapper.isConnected) {
							const actualHeight = wrapper.offsetHeight;
							const estimatedHeight = this.itemHeights.get(i) || this.getItemHeight(i);
							if (Math.abs(actualHeight - estimatedHeight) > 1) {
								this.itemHeights.set(i, actualHeight);
								this.totalHeight = this.calculateHeights();
								this.content.style.height = this.totalHeight + 'px';
								this.updateItemPositions();
							}
						}
					});
					this.renderedItems.set(i, wrapper);
				}
				this.updateActiveState(this.currentItemId);
			}
			formatDate(dateString) {
				return new Date(dateString).toLocaleDateString();
			}
			findIndexById(itemId) {
				if (!itemId) return -1;
				const item = this.items.find((it) => {
					const itemIdValue = it.id || it.url;
					return itemIdValue === itemId;
				});
				return item ? this.items.indexOf(item) : -1;
			}
			updateItemPositions() {
				this.renderedItems.forEach((wrapper, index) => {
					if (wrapper && wrapper.isConnected) {
						const newTop = this.getItemStart(index);
						wrapper.style.top = newTop + 'px';
					}
				});
			}
			updateActiveState(activeItemId) {
				if (activeItemId !== undefined && activeItemId !== null) {
					this.currentItemId = activeItemId;
				}
				const currentIndex = this.findIndexById(this.currentItemId);
				this.renderedItems.forEach((wrapper, index) => {
					const img = wrapper.querySelector('.thumbnail');
					if (img) {
						if (index === currentIndex && currentIndex >= 0) {
							img.classList.add('active');
						} else {
							img.classList.remove('active');
						}
					}
				});
			}
			onThumbnailClick(itemId) {
			}
			onLoadMore(direction) {
			}
			scrollToIndex(index, smooth = false) {

				const itemStart = this.getItemStart(index);
				const itemHeight = this.getItemHeight(index);
				const targetScroll = Math.max(
					0,
					Math.min(
						itemStart - (this.containerHeight / 2) + (itemHeight / 2),
						this.totalHeight - this.containerHeight
					)
				);
				if (smooth) {
					this.container.scrollTo({ top: targetScroll, behavior: 'smooth' });
				} else {
					this.container.scrollTop = targetScroll;
				}
			}
			scrollToBottom(smooth = false) {
				const maxScroll = this.totalHeight - this.containerHeight;
				const targetScroll = Math.max(0, maxScroll);
				if (smooth) {
					this.container.scrollTo({ top: targetScroll, behavior: 'smooth' });
				} else {
					this.container.scrollTop = targetScroll;
				}
			}
			update(items, selectedItemId, hasMoreBefore, hasMoreAfter) {
				const previousLength = this.items.length;
				const wasLoadingBefore = this.isLoadingBefore;
				const wasLoadingAfter = this.isLoadingAfter;
				const previousScrollHeight = this.container.scrollHeight;
				const previousScrollTop = this.container.scrollTop;
				this.renderedItems.forEach((element, index) => {
					if (element && element.isConnected) {
						if (this.itemResizeObserver) {
							this.itemResizeObserver.unobserve(element);
						}
						element.remove();
					}
				});
				this.renderedItems.clear();
				this.itemHeights.clear();
				this._cumulativePositions = new Map();
				this.items = items;
				this.totalHeight = this.calculateHeights();
				this.content.style.height = this.totalHeight + 'px';
				if (hasMoreBefore !== undefined) this.hasMoreBefore = hasMoreBefore;
				if (hasMoreAfter !== undefined) this.hasMoreAfter = hasMoreAfter;
				if (!wasLoadingBefore && !wasLoadingAfter && selectedItemId !== undefined && selectedItemId !== null) {
					this.currentItemId = selectedItemId;
				}
				this.visibleRange = { start: -1, end: -1 };
				this.render();
				this.updateActiveState(this.currentItemId);
				if (wasLoadingBefore && items.length > previousLength) {
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							const newScrollHeight = this.container.scrollHeight;
							const heightDifference = newScrollHeight - previousScrollHeight;
							if (heightDifference > 0) {
								this.container.scrollTop = previousScrollTop + heightDifference;
							}
							this.savedScrollHeight = 0;
							this.savedScrollTop = 0;
							this.isLoadingBefore = false;
						});
					});
				} else {
					this.isLoadingBefore = false;
					this.isLoadingAfter = false;
				}
				if (!wasLoadingBefore && !wasLoadingAfter && selectedItemId !== undefined && selectedItemId !== null) {
					const selectedIndex = this.findIndexById(selectedItemId);
					if (selectedIndex >= 0) {
						requestAnimationFrame(() => {
							this.scrollToIndex(selectedIndex, false);
						});
					}
				}
			}
			setLoadingState(direction, isLoading) {
				if (direction === 'before') {
					this.isLoadingBefore = isLoading;
				} else {
					this.isLoadingAfter = isLoading;
				}
			}
			destroy() {
				this.container.removeEventListener('scroll', this.handleScroll);
				if (this.resizeObserver) {
					this.resizeObserver.disconnect();
				}
				if (this.itemResizeObserver) {
					this.itemResizeObserver.disconnect();
				}
				this.renderedItems.clear();
				this.itemHeights.clear();
				this._cumulativePositions = null;
				if (this.content && this.content.parentNode) {
					this.content.remove();
				}
			}
			getTotalSize() {
				return this.totalHeight;
			}
			getScrollOffset() {
				return this.scrollTop;
			}
			getVirtualItems() {
				const items = [];
				for (let i = this.visibleRange.start; i <= this.visibleRange.end; i++) {
					if (i >= 0 && i < this.items.length) {
						const start = this.getItemStart(i);
						const height = this.getItemHeight(i);
						items.push({
							index: i,
							start: start,
							end: start + height,
							size: height
						});
					}
				}
				return items;
			}
			scrollToOffset(offset, smooth = false) {
				const maxOffset = Math.max(0, this.totalHeight - this.containerHeight);
				const targetOffset = Math.max(0, Math.min(offset, maxOffset));
				if (smooth) {
					this.container.scrollTo({ top: targetOffset, behavior: 'smooth' });
				} else {
					this.container.scrollTop = targetOffset;
				}
			}
			scrollBy(delta, smooth = false) {
				this.scrollToOffset(this.scrollTop + delta, smooth);
			}
		}
		window.ThumbnailVirtualizer = ThumbnailVirtualizer;
	`;
};
export const listThumnails = (_listImage: IAttachmentEntityWithUploader[], _indexSelect: number) => {
	return '';
};
export const scriptThumnails = (listImage: IAttachmentEntityWithUploader[], indexSelect: number) => {
	const reversedImages = [...listImage].reverse();
	const reversedIndexSelect = indexSelect >= 0 ? reversedImages.length - 1 - indexSelect : -1;
	const initialImagesData = reversedImages.map((image: IAttachmentEntityWithUploader) => ({
		id: escapeHtml(image.id || image.url || ''),
		url: sanitizeUrl(image.url),
		avatar: sanitizeUrl(image.uploaderData.avatar),
		name: escapeHtml(image.uploaderData.name),
		fileName: escapeHtml(image.filename),
		realUrl: sanitizeUrl(image.realUrl || ''),
		create_time: image.create_time,
		time: escapeHtml(formatDateTime(image.create_time)),
		isVideo: image.isVideo,
		filetype: image.filetype,
		width: image.width || 600,
		height: image.height || 400
	}));

	const imagesDataStr = JSON.stringify(initialImagesData);
	return `
		${createThumbProxyUrlScript()}
		${createVirtualizer()}
		const thumbnailContainer = document.getElementById('thumbnails-content');
		let imagesData = ${imagesDataStr};
		let currentItemId = null;

		const updateNavigationButtons = () => {
			const currentIndex = imagesData.findIndex(img => (img.id || img.url) === currentItemId);
			const prevBtn = document.getElementById('prevImageBtn');
			const nextBtn = document.getElementById('nextImageBtn');

			if (prevBtn) {
				prevBtn.disabled = currentIndex <= 0;
			}
			if (nextBtn) {
				nextBtn.disabled = currentIndex >= imagesData.length - 1;
			}
		};

		if (thumbnailContainer && window.ThumbnailVirtualizer) {
			const virtualizer = new window.ThumbnailVirtualizer(
				thumbnailContainer,
				imagesData,
				{
					overscan: 3,
					useAnimationFrame: true
				}
			);
			virtualizer.onThumbnailClick = function(itemId) {
				const imageData = imagesData.find(img => (img.id || img.url) === itemId);
				if (!imageData) return;
				resetTransform();
				currentItemId = itemId;
				updateNavigationButtons();

				const selectedMedia = document.getElementById('selectedMedia');
				if (selectedMedia) {
					const isNewVideo = imageData.isVideo ||
						imageData.url?.includes('.mp4') ||
						imageData.url?.includes('.mov') ||
						imageData.filetype?.includes('video/') ||
						imageData.filetype?.includes('mp4') ||
						imageData.filetype?.includes('mov');
					const wasVideo = selectedMedia.tagName === 'VIDEO';

					if (!isNewVideo) {
						handleMediaLoading(true);
					}

					if (isNewVideo !== wasVideo) {
						const wrapper = document.getElementById('selected-image-wrapper');
						if (wrapper) {
							const skeleton = document.getElementById('skeleton-main');
							const media = document.getElementById('selectedMedia');
							const errorDiv = wrapper.querySelector('.image-error');
							if (skeleton) skeleton.remove();
							if (media) media.remove();
							if (errorDiv) errorDiv.remove();

							if (!isNewVideo) {
								const newSkeleton = document.createElement('div');
								newSkeleton.id = 'skeleton-main';
								newSkeleton.className = 'skeleton skeleton-main';
								if (imageData.width && imageData.height) {
									newSkeleton.style.width = imageData.width + 'px';
									newSkeleton.style.height = imageData.height + 'px';
									newSkeleton.style.maxWidth = '100%';
									newSkeleton.style.maxHeight = '100%';
								}
								const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
								iconSvg.setAttribute('class', 'skeleton-icon');
								iconSvg.setAttribute('fill', 'none');
								iconSvg.setAttribute('viewBox', '0 0 24 24');
								const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
								path.setAttribute('stroke', 'currentColor');
								path.setAttribute('stroke-linecap', 'round');
								path.setAttribute('stroke-linejoin', 'round');
								path.setAttribute('stroke-width', '2');
								path.setAttribute('d', 'm3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z');
								iconSvg.appendChild(path);
								newSkeleton.appendChild(iconSvg);
								wrapper.insertBefore(newSkeleton, wrapper.firstChild);
							}

							if (isNewVideo) {
								const video = document.createElement('video');
								video.id = 'selectedMedia';
								video.className = 'selected-image image-loaded';
								const videoUrl = sanitizeImageUrl(imageData.realUrl || imageData.url);
								if (videoUrl) {
									video.src = videoUrl;
								}
								video.controls = true;
								video.autoplay = true;
								video.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
								video.addEventListener('loadeddata', handleMediaLoaded);
								video.addEventListener('error', handleMediaError);
								wrapper.insertBefore(video, wrapper.querySelector('.navigation-buttons'));
							} else {
								const img = document.createElement('img');
								img.id = 'selectedMedia';
								img.className = 'selected-image image-loading';
								img.addEventListener('load', handleMediaLoaded);
								img.addEventListener('error', handleMediaError);
								img.src = createImageProxyUrl(imageData.url);
								wrapper.insertBefore(img, wrapper.querySelector('.navigation-buttons'));
								if (img.complete && img.naturalHeight !== 0) {
									handleMediaLoaded();
								}
							}
						}
					} else {
						const wrapper = document.getElementById('selected-image-wrapper');
						const errorDiv = wrapper?.querySelector('.image-error');
						if (errorDiv) errorDiv.remove();

						selectedMedia.style.display = '';

						if (wasVideo) {
							const videoUrl = sanitizeImageUrl(imageData.realUrl || imageData.url);
							if (videoUrl) {
								selectedMedia.src = videoUrl;
								selectedMedia.addEventListener('loadeddata', handleMediaLoaded, { once: true });
								selectedMedia.addEventListener('error', handleMediaError, { once: true });
								selectedMedia.load();
								selectedMedia.play();
							}
						} else {
							selectedMedia.classList.add('image-loading');
							selectedMedia.classList.remove('image-loaded');
							selectedMedia.addEventListener('load', handleMediaLoaded, { once: true });
							selectedMedia.addEventListener('error', handleMediaError, { once: true });
							selectedMedia.src = createImageProxyUrl(imageData.url);
							if (selectedMedia.complete && selectedMedia.naturalHeight !== 0) {
								handleMediaLoaded();
							}
						}
					}
				}
				const userAvatar = document.getElementById('userAvatar');
				if (userAvatar) {
					userAvatar.src = sanitizeImageUrl(imageData.avatar);
				}
				const username = document.getElementById('username');
				if (username) {
					username.textContent = imageData.name;
				}
				const timestamp = document.getElementById('timestamp');
				if (timestamp) {
					timestamp.textContent = imageData.time;
				}
				currentImageUrl = {
					fileName: imageData.fileName,
					url: imageData.url,
					realUrl: imageData.realUrl,
					isVideo: imageData.url && (imageData.url.includes('.mp4') || imageData.url.includes('.mov'))
				};
				virtualizer.updateActiveState(itemId);
				updateNavigationButtons();
			};
			virtualizer.onLoadMore = function(direction) {
				if (window.electron && window.electron.send) {
					window.electron.send('APP::LOAD_MORE_ATTACHMENTS', { direction });
				}
			};
				let currentIndex = ${reversedIndexSelect} >= 0 ? ${reversedIndexSelect} : -1;
				if (currentIndex >= 0 && imagesData[currentIndex]) {
					currentItemId = imagesData[currentIndex].id || imagesData[currentIndex].url;
					virtualizer.currentItemId = currentItemId;
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							virtualizer.updateActiveState(currentItemId);
						});
					});
				}
				requestAnimationFrame(() => {
					if (currentIndex >= 0) {
						virtualizer.scrollToIndex(currentIndex);
					} else {
						virtualizer.scrollToBottom();
					}
				});
			window.thumbnailVirtualizer = virtualizer;
			if (window.electron && window.electron.on) {
				window.electron.on('APP::UPDATE_ATTACHMENTS', (event, { attachments, hasMoreBefore, hasMoreAfter }) => {
					if (window.thumbnailVirtualizer && attachments) {
						const reversedAttachments = [...attachments].reverse();
						const updatedImagesData = reversedAttachments.map(att => ({
							id: (att.id || att.url || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'),
							url: sanitizeImageUrl(att.url),
							avatar: sanitizeImageUrl(att.uploaderData?.avatar || ''),
							name: (att.uploaderData?.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'),
							fileName: (att.filename || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'),
							realUrl: sanitizeImageUrl(att.realUrl || att.url || ''),
							create_time: att.create_time,
							time: att.create_time,
							isVideo: att.isVideo,
							filetype: att.filetype,
							width: att.width || 600,
							height: att.height || 400
						}));
						imagesData = updatedImagesData;
						const preservedItemId = window.thumbnailVirtualizer.currentItemId || currentItemId;
						window.thumbnailVirtualizer.update(updatedImagesData, undefined, hasMoreBefore, hasMoreAfter);
						if (window.thumbnailVirtualizer.currentItemId) {
							currentItemId = window.thumbnailVirtualizer.currentItemId;
							const itemIndex = imagesData.findIndex(img => (img.id || img.url) === currentItemId);
							if (itemIndex >= 0) {
								currentIndex = itemIndex;
							}
						}
					}
				});
			}

			document.addEventListener('keydown', (e) => {
			   if (e.repeat) {
      return;
    }
				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					e.preventDefault();
					const currentIndex = window.thumbnailVirtualizer.findIndexById(currentItemId);
					let newIndex = -1;

					if (e.key === 'ArrowUp') {
						newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
					} else if (e.key === 'ArrowDown') {
						newIndex = currentIndex < imagesData.length - 1 ? currentIndex + 1 : currentIndex;
					}

					if (newIndex >= 0 && newIndex < imagesData.length) {
						const newImageData = imagesData[newIndex];
						const newItemId = newImageData.id || newImageData.url;

						if (window.thumbnailVirtualizer.onThumbnailClick) {

							window.thumbnailVirtualizer.onThumbnailClick(newItemId);
						}

						requestAnimationFrame(() => {
							window.thumbnailVirtualizer.scrollToIndex(newIndex, false);
							updateNavigationButtons();
						});
					}
				}
			});

			updateNavigationButtons();
		}
	`;
};
const scriptRotateAndZoom = () => {
	return `
 let currentRotation = 0;
 let currentZoom = 1;
 const resetTransform = () => {
   currentRotation = 0;
   currentZoom = 1;
   if (selectedMedia && !isVideo) {
     selectedMedia.style.transform = 'none';
   }
 };

 if (isVideo) {
   document.getElementById('rotateRightBtn').style.display = 'none';
   document.getElementById('rotateLeftBtn').style.display = 'none';
   document.getElementById('zoomInBtn').style.display = 'none';
   document.getElementById('zoomOutBtn').style.display = 'none';
 } else {
   document.getElementById('rotateRightBtn').addEventListener('click', () => {
     currentRotation = currentRotation + 90;
     if(currentRotation % 180 === 90){
       selectedMedia.classList.add('rotate-width');
     }else{
       selectedMedia.classList.remove('rotate-width');
     }
     selectedMedia.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom})\`;
   });

   document.getElementById('rotateLeftBtn').addEventListener('click', () => {
     currentRotation = currentRotation - 90;
     selectedMedia.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom})\`;
   });

   document.getElementById('zoomInBtn').addEventListener('click', () => {
     currentZoom = currentZoom + 0.25;
     selectedMedia.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom})\`;
   });

   document.getElementById('zoomOutBtn').addEventListener('click', () => {
     if (currentZoom - 0.25 >= 1) {
       currentZoom = currentZoom - 0.25;
       selectedMedia.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom})\`;
     }
   });
 }
 `;
};
const scriptDrag = () => {
	return `
  let currenPosition = {
		x: 0,
		y: 0
	};
	let dragstart = {
		x: 0,
		y: 0
	};
	let dragStatus = false;

  if (!isVideo && selectedMedia) {
    selectedMedia.addEventListener('mousemove', (e)=>{
      if (currentZoom > 1 && dragStatus) {
        currenPosition = {
          x: e.clientX - dragstart.x,
          y: e.clientY - dragstart.y
        };
        selectedMedia.style.transform = \`scale(\${currentZoom}) translate(\${currenPosition.x / currentZoom}px, \${currenPosition.y / currentZoom}px) rotate(\${currentRotation}deg)\`;
      }
    });

    selectedMedia.addEventListener('mousedown', (event)=>{
      dragStatus = true;
      dragstart = {
        x: event.clientX - currenPosition.x,
        y: event.clientY - currenPosition.y
      };
    });

    document.addEventListener('mouseup', (event)=>{
      dragStatus = false;
      event.stopPropagation();
    });

    selectedMedia.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    selectedMedia.addEventListener('wheel', (e)=>{
      const delta = e.deltaY * -0.001;
      currentZoom = Math.max(1, Math.min(currentZoom + delta, 5));
      selectedMedia.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom})\`;
    }, { passive: false });
  }
  `;
};
const scriptMenu = () => {
	return `
document.addEventListener('contextmenu', (e) => {
	if (e.target.matches('#selectedMedia')) {
		e.preventDefault();
		const menu = document.getElementById('contextMenu');
		if (!menu) return;
		menu.style.left = e.pageX + 'px';
		menu.style.top = e.pageY + 'px';
		menu.classList.add('visible');
		const rect = menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		if (rect.right > viewportWidth) {
			menu.style.left = '\${e.pageX - rect.width}px';
		}
		if (rect.bottom > viewportHeight) {
			menu.style.top = '\${e.pageY - rect.height}px';
		}
	}
})
const convertImageToBlobFile = async (urlData) => {
	try {
		const response = await fetch(urlData);
		const blob = await response.blob();
		return blob;
	} catch (error) {
		console.error('Error converting image to blob:', error);
		return null;
	}
};
const handleCopyImage = async (urlData) => {
	try {
        const blob = await convertImageToBlobFile(urlData);
        if (!blob) {
          console.error('Failed to fetch or convert image');
          return;
        }
        const file = new File([blob], 'image.png', { type: 'image/png' });
        if (navigator.clipboard && navigator.clipboard.write) {
          try {
            const clipboardItem = new ClipboardItem({ 'image/png': file });
            await navigator.clipboard.write([clipboardItem]);
          } catch (error) {
            console.error('Failed to write image to clipboard:', error);
          }
        } else {
          console.error('Clipboard API not supported. Image data not copied.');
        }
      } catch (error) {
        console.error('Error fetching or converting image:', error);
      }
    };
        function showToast() {
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
menu.addEventListener('click', async (e) => {
			e.stopPropagation();
			const action = e.target.closest('.menu-item')?.dataset.action;
			if (action) {
				if (!e.currentTarget) return;
				switch (action) {
					case 'copyImage': {
						window.electron.handleActionShowImage(action, currentImageUrl.realUrl)
							.then((result) => {
								if (result?.success) {
									showToast();
								} else {
									console.error('Copy failed:', result?.error || 'Unknown error');
								}
							})
							.catch((error) => {
								console.error('Copy failed:', error);
							});
						break;
					}
          default :
          window.electron.handleActionShowImage(action, currentImageUrl.realUrl);
						break;
				}
				menu.classList.remove('visible');
			}
		});
  `;
};
export default openImagePopup;
