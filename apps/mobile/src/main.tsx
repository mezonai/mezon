import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './app/navigation';
import CustomIncomingCall from './app/screens/customIncomingCall';
import { createLocalNotification, setupIncomingCall } from './app/utils/pushNotificationHelpers';
notifee.onBackgroundEvent(async () => {});

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
	const title = remoteMessage?.notification?.title;
	if (title === 'Incoming call') {
		await setupIncomingCall(remoteMessage?.notification?.body);
	} else {
		await createLocalNotification(remoteMessage.notification?.title, remoteMessage.notification?.body, remoteMessage.data);
	}
});
AppRegistry.registerComponent('MyReactNativeApp', () => CustomIncomingCall);
AppRegistry.registerComponent('Mobile', () => HeadlessCheck);

function HeadlessCheck({ isHeadless }) {
	if (isHeadless) {
		return null;
	}

	return <App />;
}
