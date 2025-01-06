import { CreateMezonClientOptions, MezonContextProvider } from '@mezon/transport';
import * as React from 'react';
import WrapperIncomingCall from './WrapperIncomingCall';

const mezon: CreateMezonClientOptions = {
	host: process.env.NX_CHAT_APP_API_HOST as string,
	key: process.env.NX_CHAT_APP_API_KEY as string,
	port: process.env.NX_CHAT_APP_API_PORT as string,
	ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
};
export default function CustomIncomingCall(props: any) {
	return (
		<MezonContextProvider mezon={mezon} connect={true} isFromMobile={true}>
			<WrapperIncomingCall {...props} />
		</MezonContextProvider>
	);
}
