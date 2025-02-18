import { registerGlobals } from '@livekit/react-native';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './src/app/navigation';
import CustomIncomingCall from './src/app/screens/customIncomingCall';
import { createLocalNotification, setupIncomingCall } from './src/app/utils/pushNotificationHelpers';
notifee.onBackgroundEvent(async () => {});

// eslint-disable-next-line no-undef
if (__DEV__) {
	require('./reactotronConfig');
}

registerGlobals();
enableScreens(true);
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
	const offer = remoteMessage?.data?.offer;
	if (offer) {
		await setupIncomingCall(offer);
	} else {
		await createLocalNotification(remoteMessage.notification?.title, remoteMessage.notification?.body, remoteMessage.data);
	}
});
AppRegistry.registerComponent('ComingCallApp', () => CustomIncomingCall);
AppRegistry.registerComponent('Mobile', () => App);
