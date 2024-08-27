const START_NOTIFICATION_SERVICE = 'PUSH_RECEIVER:::START_NOTIFICATION_SERVICE';
const NOTIFICATION_SERVICE_STARTED = 'PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED';
const NOTIFICATION_SERVICE_ERROR = 'PUSH_RECEIVER:::NOTIFICATION_SERVICE_ERROR';
const NOTIFICATION_RECEIVED = 'PUSH_RECEIVER:::NOTIFICATION_RECEIVED';
const TOKEN_UPDATED = 'PUSH_RECEIVER:::TOKEN_UPDATED';

window.electron?.senderId('sender-id').then((senderId) => {
	window.electron?.send(START_NOTIFICATION_SERVICE, senderId);
});

window.electron?.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
	localStorage.setItem('fcmToken', token);
	window.electron.getDeviceId().then((deviceId) => {
		const fcmTokenObject = { token, deviceId };
		localStorage.setItem('fcmTokenObject', JSON.stringify(fcmTokenObject));
	});
});

window.electron?.onDeepLinkUrl((deepLinkUrl) => {
	localStorage.removeItem('deepLinkUrl');
	localStorage.setItem('deepLinkUrl', JSON.stringify(deepLinkUrl));
});

window.electron?.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
	console.log('notification error', error);
});

// Send FCM token to backend
window.electron?.on(TOKEN_UPDATED, (_, token) => {
	console.log('token updated', token);
});

window.electron?.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
	if (serverNotificationPayload.notification.body) {
		const notifi = new Notification(serverNotificationPayload.notification.title, {
			body: serverNotificationPayload.notification.body,
			icon: serverNotificationPayload.notification.image,
			data: {
				link: serverNotificationPayload.data.link
			}
		});
		notifi.onclick = () => {
			if (notifi.data && notifi.data.link) {
				window.location.href = notifi.data.link;
			}
		};
	} else {
		console.log('do something with the key/value pairs in the data', serverNotificationPayload.data);
	}
});
