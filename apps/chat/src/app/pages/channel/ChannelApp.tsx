import {
	channelAppActions,
	getStore,
	giveCoffeeActions,
	selectChannelAppChannelId,
	selectChannelAppClanId,
	selectSendTokenEvent,
	useAppDispatch
} from '@mezon/store';
import { Loading } from '@mezon/ui';
import type { ApiChannelAppResponseExtend } from '@mezon/utils';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

const buildAppUrl = (appChannel?: ApiChannelAppResponseExtend) => {
	if (!appChannel?.app_url) return '';

	const url = new URL(appChannel.app_url);

	if (appChannel.subpath) {
		url.pathname = `${url.pathname}${appChannel.subpath}`.replace(/\/\/+/g, '/');
	}

	if (appChannel.code) {
		url.searchParams.set('code', appChannel.code);
	}
	return url.toString();
};

export const ChannelApps = React.memo(({ appChannel }: { appChannel: ApiChannelAppResponseExtend }) => {
	const dispatch = useAppDispatch();
	const store = getStore();

	const sendTokenEvent = useSelector(selectSendTokenEvent);

	useEffect(() => {
		const currentChannelAppClanId = selectChannelAppClanId(store.getState());
		const currentChannelAppId = selectChannelAppChannelId(store.getState());
		if (currentChannelAppId && currentChannelAppClanId) {
			dispatch(channelAppActions.setJoinChannelAppData({ dataUpdate: undefined }));
		}
		dispatch(channelAppActions.setRoomId({ channelId: appChannel?.channel_id as string, roomId: null }));
		dispatch(channelAppActions.setChannelId(appChannel?.channel_id || '0'));
		dispatch(channelAppActions.setClanId(appChannel?.clan_id || null));
	}, []);

	useEffect(() => {
		const handleTokenListerner = () => {
			dispatch(giveCoffeeActions.setSendTokenEvent(null));
			dispatch(giveCoffeeActions.setInfoSendToken(null));
		};

		if (sendTokenEvent) {
			handleTokenListerner();
		}
	}, [sendTokenEvent]);

	return appChannel?.app_url ? (
		<div className="relative w-full h-full rounded-b-lg">
			<div className="w-full h-full">
				<iframe
					allow="clipboard-read; clipboard-write; camera"
					title={appChannel?.app_url}
					src={buildAppUrl(appChannel)}
					className="w-full h-full rounded-b-lg"
				/>
			</div>
		</div>
	) : (
		<div className="w-full h-full flex items-center justify-center rounded-b-lg">
			<Loading />
		</div>
	);
});
