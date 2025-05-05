import { registerGlobals } from '@livekit/react-native';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './app/navigation';
import CustomIncomingCall from './app/screens/customIncomingCall';
import { createLocalNotification, setupIncomingCall } from './app/utils/pushNotificationHelpers';
notifee.onBackgroundEvent(async () => {});

registerGlobals();
enableScreens(true);
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
	const offer = remoteMessage?.data?.offer;
	if (offer) {
		await setupIncomingCall(offer as string);
	} else if (!remoteMessage?.notification) {
		await createLocalNotification(remoteMessage?.data?.title as string, remoteMessage?.data?.body as string, remoteMessage.data);
	} else {
		// 	empty
	}
});
AppRegistry.registerComponent('ComingCallApp', () => CustomIncomingCall);
AppRegistry.registerComponent('Mobile', () => App);
