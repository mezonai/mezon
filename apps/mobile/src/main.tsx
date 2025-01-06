import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './app/navigation';
import CustomIncomingCall from './app/screens/customIncomingCall';
import { createLocalNotification, setupIncomingCall } from './app/utils/pushNotificationHelpers';
notifee.onBackgroundEvent(async () => {});
if (__DEV__) {
	require('../reactotronConfig');
}
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
	const offer = remoteMessage?.data?.offer;
	if (offer) {
		await setupIncomingCall(offer as string);
	} else {
		await createLocalNotification(remoteMessage.notification?.title, remoteMessage.notification?.body, remoteMessage.data);
	}
});
AppRegistry.registerComponent('ComingCallApp', () => CustomIncomingCall);
AppRegistry.registerComponent('Mobile', () => HeadlessCheck);

function HeadlessCheck({ isHeadless }) {
	if (isHeadless) {
		return null;
	}

	return <App />;
}
