import { BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import App from '../../app/app';
import image_window_css from './image-window-css';

import { ApiChannelAttachment } from 'mezon-js/api.gen';
import { escapeHtml, sanitizeUrl } from '../../app/utils';
import menu from '../menu-context';

interface IAttachmentEntity extends ApiChannelAttachment {
	id: string;
	channelId?: string;
	clanId?: string;
}

interface IAttachmentEntityWithUploader extends IAttachmentEntity {
	uploaderData: {
		avatar: string;
		name: string;
	};
	realUrl: string;
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
};

function openImagePopup(imageData: ImageData, parentWindow: BrowserWindow = App.mainWindow, params?: Record<string, string>) {
	const parentBounds = parentWindow.getBounds();
	const activeIndex = imageData.channelImagesData.selectedImageIndex;
	// Calculate initial size (150% of parent window)
	const width = Math.floor(parentBounds.width * 1.0);
	const height = Math.floor(parentBounds.height * 1.0);

	// Calculate position to center over parent window
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
		minWidth: 200, // Minimum window size
		minHeight: 200,
		resizable: true, // Allow resizing
		movable: true, // Allow moving
		hasShadow: true
	});

	const htmlPath = join(__dirname, 'image-viewer.html');

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
</head>
<body>
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
    <div id="close-window" class="function-button">
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
      <img id="selectedImage" class="selected-image" src="${sanitizeUrl(imageData.url)}" />
    </div>
    <div id="thumbnails" class="thumbnail-container">
      <div id="thumbnails-content" class="thumbnails-content">
      ${listThumnails(imageData.channelImagesData.images, activeIndex)}
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <div class="sender-info">
      <img id="userAvatar" src="${escapeHtml(imageData.uploaderData.avatar)}" class="user-avatar" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
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
          <path fill-rule="evenodd" clip-rule="evenodd" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z" fill="currentColor"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10 14C10 14.5523 10.4477 15 11 15C11.5523 15 12 14.5523 12 14V12H14C14.5523 12 15 11.5523 15 11C15 10.4477 14.5523 10 14 10H12V8C12 7.44772 11.5523 7 11 7C10.4477 7 10 7.44772 10 8V10H8C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12H10V14Z" fill="currentColor"></path>
        </svg>
      </button>
      <button class="control-button" id="zoomOutBtn">
          <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z" fill="#ffffff"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7 11C7 10.4477 7.44772 10 8 10H14C14.5523 10 15 10.4477 15 11C15 11.5523 14.5523 12 14 12H8C7.44772 12 7 11.5523 7 11Z" fill="#ffffff"/>
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
  <div id="toast" class="toast">Image copied</div>
</div>

</body>
</html>
  `;
	// Load the HTML content
	// writeFileSync(htmlPath, imageViewerHtml);

	// popupWindow.loadURL(
	// 	format({
	// 		pathname: htmlPath,
	// 		protocol: 'file:',
	// 		slashes: true
	// 	})
	// );

	popupWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(imageViewerHtml));

	// Add IPC handlers for window controls
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

	// Show window when ready with fade-in effect
	popupWindow.once('ready-to-show', () => {
		popupWindow.show();
		popupWindow.webContents.executeJavaScript(`

	    const selectedImage = document.getElementById('selectedImage');
      let currentImageUrl = {
        fileName : '${imageData.filename}',
        url : '${imageData.url}',
          realUrl : '${imageData.realUrl}'
      };
      document.getElementById('close-window').addEventListener('click', () => {
		selectedImage.src = null;
    	window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_IMAGE_WINDOW');
	});

	document.getElementById('minimize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MINIMIZE_WINDOW');
	});
  document.getElementById('channel-label').innerHTML = '${imageData.channelImagesData.channelLabel}';

	document.getElementById('maximize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MAXIMIZE_WINDOW');
	});

 document.getElementById('downloadBtn').addEventListener('click', () => {
window.electron.handleActionShowImage('saveImage',currentImageUrl.url);
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

document.getElementById('selectedImage').addEventListener('click', (e)=>{
     e.stopPropagation();
})

document.addEventListener('keydown', (e) => {
		switch (e.key) {
			case 'Escape':
				selectedImage.src = null;
    	  window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_IMAGE_WINDOW');
				break;
		}
	});

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

	// Clean up on close
	popupWindow.on('closed', () => {
		ipcMain.removeHandler('minimize-window');
		ipcMain.removeHandler('maximize-window');
		App.imageViewerWindow = null;
		App.imageScriptWindowLoaded = false;
	});
	App.imageViewerWindow = popupWindow;
	return popupWindow;
}

function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString();
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

export const listThumnails = (listImage, indexSelect) => {
	return listImage
		.map((image, index) => {
			const currentDate = escapeHtml(formatDate(image.create_time));
			const prevDate = index > 0 ? escapeHtml(formatDate(listImage[index - 1].create_time)) : null;
			const dateLabel = currentDate !== prevDate ? `<div class="date-label">${currentDate}</div>` : '';
			return ` <div class="thumbnail-wrapper" id="thumbnail-${index}"> ${dateLabel} <img class="thumbnail ${indexSelect === index ? 'active' : ''}"  src="${escapeHtml(image.url)}" alt="${escapeHtml(image.filename)}" /> </div> `;
		})
		.join('');
};

export const scriptThumnails = (listImage, indexSelect) => {
	return listImage
		.map((image, index) => {
			const time = escapeHtml(formatDateTime(image.create_time));
			return `document.getElementById('thumbnail-${index}').addEventListener('click', () => {
        selectedImage.src = '${sanitizeUrl(image.url)}';
        document.querySelectorAll('.thumbnail').forEach(img => img.classList.remove('active'));
        document.getElementById('thumbnail-${index}').querySelector('.thumbnail').classList.add('active');
         document.getElementById('thumbnail-${index}').querySelector('.thumbnail').scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById('userAvatar').src = "${sanitizeUrl(image.uploaderData.avatar)}"
        document.getElementById('username').innerHTML  = "${escapeHtml(image.uploaderData.name)}"
        document.getElementById('timestamp').innerHTML  = "${time}"
      currentImageUrl = {
        fileName : '${image.fileName}',
        url : '${image.url}',
        realUrl : '${image.realUrl || ''}'
      }

        currentIndex = ${index}
      });`;
		})
		.join('');
};

const scriptRotateAndZoom = () => {
	return `
 let currentRotation = 0;
 let currentZoom = 1;
 document.getElementById('rotateRightBtn').addEventListener('click', () => {
 currentRotation = currentRotation + 90;
 if(currentRotation % 180 === 90){
  selectedImage.classList.add('rotate-width');
 }else{
  selectedImage.classList.remove('rotate-width');
 }
 selectedImage.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom})\`; });

  document.getElementById('rotateLeftBtn').addEventListener('click', () => {
 currentRotation = currentRotation - 90;
 selectedImage.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom}) \`; });

 document.getElementById('zoomInBtn').addEventListener('click', () => {
  currentZoom = currentZoom + 0.25
 selectedImage.style.transform = \`rotate(\${currentRotation}deg) translate(0,0)  scale(\${currentZoom}) \`;
  });

document.getElementById('zoomOutBtn').addEventListener('click', () => {
if (currentZoom - 0.25 >= 1) {
  currentZoom = currentZoom - 0.25;
  selectedImage.style.transform = \`rotate(\${currentRotation}deg) translate(0,0)  scale(\${currentZoom}) \`;
}

 });

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

  selectedImage.addEventListener('mousemove', (e)=>{
    if (currentZoom > 1 && dragStatus) {
			currenPosition = {
				x: e.clientX - dragstart.x,
				y: e.clientY - dragstart.y
        };
			selectedImage.style.transform = \`scale(\${currentZoom}) translate(\${currenPosition.x / currentZoom}px, \${currenPosition.y / currentZoom}px) rotate(\${currentRotation}deg)  \`;
		}
  });

  selectedImage.addEventListener('mousedown', (event)=>{
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

  selectedImage.addEventListener('dragstart', (e) => {
		e.preventDefault();
		e.stopPropagation();
	});

  selectedImage.addEventListener('wheel', (e)=>{
  	const delta = e.deltaY * -0.001;
		currentZoom = Math.max(1, Math.min(currentZoom + delta, 5));
 selectedImage.style.transform = \`rotate(\${currentRotation}deg) translate(0,0) scale(\${currentZoom}) \`;

  }, { passive: false });

  `;
};

const scriptMenu = () => {
	return `

document.addEventListener('contextmenu', (e) => {
	if (e.target.matches('#selectedImage')) {
		e.preventDefault();
		const menu = document.getElementById('contextMenu');
		if (!menu) return;

		menu.style.left = e.pageX + 'px';
		menu.style.top = e.pageY + 'px';
		menu.classList.add('visible');

		// Adjust position if menu goes outside viewport
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
						window.electron.handleActionShowImage(action,currentImageUrl.realUrl );
						break;
					}
          default :
          window.electron.handleActionShowImage(action, selectedImage.src);
						break;
				}
				menu.classList.remove('visible');
			}
		});
  `;
};

export default openImagePopup;
