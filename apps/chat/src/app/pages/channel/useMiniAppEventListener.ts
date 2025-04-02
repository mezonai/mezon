import { channelAppActions, giveCoffeeActions, RolesClanEntity, useAppDispatch } from '@mezon/store';
import { ChannelMembersEntity, MiniAppEventType } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { ApiAccount, ApiChannelAppResponse } from 'mezon-js/api.gen';
import { useEffect, useRef } from 'react';

type GetUserHashInfo = (appId: string) => Promise<any>;

const useMiniAppEventListener = (
	appChannel: ApiChannelAppResponse | null,
	allRolesInClan: RolesClanEntity[],
	userChannels: ChannelMembersEntity[],
	userProfile: ApiAccount | null | undefined,
	getUserHashInfo: GetUserHashInfo
) => {
	const dispatch = useAppDispatch();
	const miniAppRef = useRef<HTMLIFrameElement | null>(null);

	useEffect(() => {
		if (!appChannel?.app_url) return;

		const compareHost = (url1: string, url2: string) => {
			try {
				const parsedURL1 = new URL(url1);
				const parsedURL2 = new URL(url2);
				return parsedURL1.hostname === parsedURL2.hostname;
			} catch (error) {
				return false;
			}
		};

		const handleMessage = async (event: MessageEvent) => {
			if (!appChannel?.app_url || !compareHost(event.origin, appChannel.app_url)) return;

			const eventData = safeJSONParse(event.data ?? '{}') || {};
			const { eventType } = eventData;
			if (!eventType) return;

			switch (eventType) {
				case MiniAppEventType.PING:
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.PONG, eventData: { message: MiniAppEventType.PONG } }),
						appChannel.app_url
					);
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.CURRENT_USER_INFO, eventData: userProfile as ApiAccount }),
						appChannel.app_url
					);
					break;
				case MiniAppEventType.SEND_TOKEN:
					// eslint-disable-next-line no-case-declarations
					const { amount, note, receiver_id, extra_attribute } = (eventData.eventData || {}) as any;
					dispatch(
						giveCoffeeActions.setInfoSendToken({
							sender_id: userProfile?.user?.id,
							sender_name: userProfile?.user?.username,
							receiver_id,
							amount,
							note,
							extra_attribute
						})
					);
					dispatch(giveCoffeeActions.setShowModalSendToken(true));
					break;
				case MiniAppEventType.GET_CLAN_ROLES:
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.CLAN_ROLES_RESPONSE, eventData: allRolesInClan }),
						appChannel.app_url
					);
					break;
				case MiniAppEventType.SEND_BOT_ID:
					// eslint-disable-next-line no-case-declarations
					const { appId } = eventData.eventData || {};
					// eslint-disable-next-line no-case-declarations
					const hashData = await getUserHashInfo(appId);
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.USER_HASH_INFO, eventData: { message: hashData } }),
						appChannel.app_url
					);
					break;
				case MiniAppEventType.GET_CLAN_USERS:
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.CLAN_USERS_RESPONSE, eventData: userChannels }),
						appChannel.app_url
					);
					break;
				case MiniAppEventType.JOIN_ROOM:
					dispatch(channelAppActions.setRoomId({ channelId: appChannel?.channel_id as string, roomId: eventData.eventData?.roomId }));
					break;
				case MiniAppEventType.LEAVE_ROOM:
					dispatch(channelAppActions.setRoomId({ channelId: appChannel?.channel_id as string, roomId: null }));
					break;
				case MiniAppEventType.CREATE_VOICE_ROOM:
					dispatch(
						channelAppActions.createChannelAppMeet({
							channelId: appChannel?.channel_id as string,
							roomName: eventData.eventData?.roomId
						})
					);
					break;
				default:
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [appChannel?.app_url, userProfile, allRolesInClan, userChannels, dispatch]);

	return { miniAppRef };
};

export default useMiniAppEventListener;
