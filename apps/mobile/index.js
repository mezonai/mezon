import { registerGlobals } from '@livekit/react-native';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './src/app/navigation';
import CustomIncomingCall from './src/app/screens/customIncomingCall';
import { createLocalNotification, setupIncomingCall } from './src/app/utils/pushNotificationHelpers';

registerGlobals();
enableScreens(true);
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
	const offer = remoteMessage?.data?.offer;
	if (offer) {
		await setupIncomingCall(offer);
	} else if (!remoteMessage?.notification) {
		await createLocalNotification(remoteMessage?.data?.title, remoteMessage?.data?.body, remoteMessage.data);
	} else {
		// 	empty
	}
});
AppRegistry.registerComponent('ComingCallApp', () => CustomIncomingCall);
AppRegistry.registerComponent('Mobile', () => App);
