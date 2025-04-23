import { registerGlobals } from '@livekit/react-native';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry, Platform } from 'react-native';
import { enableFreeze } from 'react-native-screens';
import App from './app/navigation';
import CustomIncomingCall from './app/screens/customIncomingCall';
import { setupIncomingCall } from './app/utils/pushNotificationHelpers';
notifee.onBackgroundEvent(async () => {});

registerGlobals();
enableFreeze(Platform.OS === 'android');
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
	const offer = remoteMessage?.data?.offer;
	if (offer) {
		await setupIncomingCall(offer as string);
	} else {
		// await createLocalNotification(remoteMessage.notification?.title, remoteMessage.notification?.body, remoteMessage.data);
	}
});
AppRegistry.registerComponent('ComingCallApp', () => CustomIncomingCall);
AppRegistry.registerComponent('Mobile', () => App);
