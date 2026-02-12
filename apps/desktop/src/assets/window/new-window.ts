import { BrowserWindow } from 'electron';
import { join } from 'path';
import App from '../../app/app';
import { sanitizeUrl } from '../../app/utils';

import new_window_css from './new-window-css';
function openNewWindow(url: string, parentWindow: BrowserWindow = App.mainWindow) {
	const parentBounds = parentWindow.getBounds();
	const width = Math.floor(parentBounds.width * 0.8);
	const height = Math.floor(parentBounds.height * 0.8);
	const x = Math.floor(parentBounds.x + (parentBounds.width - width) / 2);
	const y = Math.floor(parentBounds.y + (parentBounds.height - height) / 2);
	const popupWindow = new BrowserWindow({
		width,
		height,
		x,
		y,
		frame: false,
		autoHideMenuBar: true,
		show: false,
		backgroundColor: '#00000000',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			webviewTag: true,
			preload: join(__dirname, 'main.preload.js')
		},
		minWidth: 200,
		minHeight: 200,
		resizable: true,
		movable: true
	});

	const title = new URL(url).hostname.split('.')[0];
	const windowSkeleton = `<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Mezon App</title>
	<link rel="stylesheet" href="../window_image/image-window.css">
	<link rel="stylesheet" href="../menu-context/index.css">
	<style>
		${new_window_css}
	</style>

</head>


<body>
<div class="window-wrapper">
	<div class="title-bar">
		<div class="app-title">${title}</div>
		<div class="functional-bar">
			<div id="reload-window" class="function-button">
				<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="svg-button">
  					<path d="M19.146 4.854l-1.489 1.489A8 8 0 1 0 12 20a8.094 8.094 0 0 0 7.371-4.886 1 1 0 1 0-1.842-.779A6.071 6.071 0 0 1 12 18a6 6 0 1 1 4.243-10.243l-1.39 1.39a.5.5 0 0 0 .354.854H19.5A.5.5 0 0 0 20 9.5V5.207a.5.5 0 0 0-.854-.353z"/>
				</svg>
			</div>
			<div id="minimize-window" class="function-button">
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-button">
					<path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
						strokeLinejoin="round" />
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
							fill="currentColor"></path>{' '}
					</g>
				</svg>
			</div>
		</div>
	</div>
	<div class="main-container">
 		<webview id="webview" src="${url}" style="width: 100%; height: calc(100% - 29px);" allowpopups></webview>
	</div>
	<div class="footer-bar">
		@${title}
	</div>
</div>

</body>

</html>`;

	// popupWindow.loadURL(url);
	popupWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(windowSkeleton)}`);

	popupWindow.once('ready-to-show', () => {
		popupWindow.show();
		popupWindow.webContents.executeJavaScript(`
			document.getElementById('close-window').addEventListener('click', () => {

    	window.electron.send('APP::CLOSE_APP_CHANNEL', 'APP::CLOSE_APP_CHANNEL');

		});

		document.getElementById('reload-window').addEventListener('click', () => {
			const webview = document.getElementById("webview");
			webview.reload();
		});

		document.getElementById('minimize-window').addEventListener('click', () => {

    	window.electron.send('APP::MINIMIZE_APP_CHANNEL', 'APP::MINIMIZE_APP_CHANNEL');

		});


	`);

		popupWindow.webContents.executeJavaScript(`window.location.url = ${JSON.stringify(sanitizeUrl(url))};`).catch((err) => console.error(err));
	});

	popupWindow.once('show', () => {
		popupWindow.webContents.executeJavaScript(`
			const webview = document.getElementById('webview');

webview.addEventListener('dom-ready', () => {
  webview.executeJavaScript('
    (function() {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
      }
      meta.content = 'width=device-width, initial-scale=1.0';
    })();
  ');
});



	`);
	});

	return popupWindow;
}
export default openNewWindow;
