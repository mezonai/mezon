import { BrowserWindow } from 'electron';
import App from '../../app/app';

function openVoiceWindow(data: any, parentWindow: BrowserWindow = App.mainWindow) {
	console.log('data: ', data);
	const popupWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			contextIsolation: false, // ✅ allow window.onmessage
			nodeIntegration: false
		}
	});

	const imageViewerHtml = `
    <!DOCTYPE html>
<html>

<head>
  <title>Popout Video</title>
</head>

<body>
  <video autoplay muted playsinline style="width: 100%; height: 100%;"></video>

  <script>
    window.onmessage = (event) => {
      const port = event.ports[0];

      port.onmessage = (msgEvent) => {
        const track = msgEvent.data;
        const stream = new MediaStream([track]);

        const video = document.querySelector('video');
        video.srcObject = stream;
        video.play();
      };

      // Let the opener know we're ready
      port.postMessage('ready');
    };
  </script>
</body>

</html>
  `;

	popupWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(imageViewerHtml));
	popupWindow.once('ready-to-show', () => {
		popupWindow.show();
	});
	popupWindow.webContents.once('did-finish-load', () => {
		// popupWindow.webContents.postMessage('port', null, [port]);
	});
	// popupWindow.webContents.once('did-finish-load', () => {
	// 	// Transfer the MessagePort to the renderer
	// 	console.log('Data :', data);
	// 	data.ports[0] && popupWindow.webContents.postMessage('init-port', null, [data.ports[0]]);
	// });
	// // Add IPC handlers for window controls
	// ipcMain.removeHandler('minimize-window');
	// ipcMain.handle('minimize-window', () => {
	// 	popupWindow.minimize();
	// });

	// ipcMain.removeHandler('maximize-window');
	// ipcMain.handle('maximize-window', () => {
	// 	if (popupWindow.isMaximized()) {
	// 		popupWindow.unmaximize();
	// 	} else {
	// 		popupWindow.maximize();
	// 	}
	// });

	// // Show window when ready with fade-in effect

	// // Clean up on close
	// popupWindow.on('closed', () => {
	// 	ipcMain.removeHandler('minimize-window');
	// 	ipcMain.removeHandler('maximize-window');
	// 	App.imageViewerWindow = null;
	// 	App.imageScriptWindowLoaded = false;
	// });
	// App.imageViewerWindow = popupWindow;
	return popupWindow;
}

export default openVoiceWindow;
