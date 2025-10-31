import type { RolesClanEntity } from '@mezon/store';
import {
	channelAppActions,
	getStore,
	giveCoffeeActions,
	selectAllChannels,
	selectAllUserClans,
	selectCurrentClan,
	useAppDispatch
} from '@mezon/store';
import type { ChannelMembersEntity } from '@mezon/utils';
import { MiniAppEventType } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import type { ApiAccount, ApiChannelAppResponse } from 'mezon-js/api.gen';
import { useEffect, useRef } from 'react';

type GetUserHashInfo = (appId: string) => Promise<any>;
type ToggleMicrophoneFunction = (enabled: boolean) => Promise<void>;

const useMiniAppEventListener = (
	appChannel: ApiChannelAppResponse | null,
	allRolesInClan: RolesClanEntity[],
	userChannels: ChannelMembersEntity[],
	userProfile: ApiAccount | null | undefined,
	getUserHashInfo: GetUserHashInfo,
	microphoneEnabled: boolean,
	toggleMicrophone: ToggleMicrophoneFunction
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
			// Enhanced security checks
			if (!appChannel?.app_url) {
				console.warn('MiniApp: No app URL configured, ignoring message');
				return;
			}

			if (!compareHost(event.origin, appChannel.app_url)) {
				// eslint-disable-next-line no-console
				console.log('MiniApp: Message from unauthorized origin:', event.origin);
				return;
			}

			// Validate message data structure
			if (!event.data || typeof event.data !== 'string') {
				console.warn('MiniApp: Invalid message data format');
				return;
			}

			let eventData;
			try {
				eventData = safeJSONParse(event.data) || {};
			} catch (error) {
				console.warn('MiniApp: Failed to parse message data:', error);
				return;
			}

			const { eventType } = eventData;
			if (!eventType || typeof eventType !== 'string') {
				console.warn('MiniApp: Missing or invalid eventType');
				return;
			}

			// Sanitize eventType to prevent injection
			const sanitizedEventType = eventType.replace(/[^\w\-_]/g, '');
			if (sanitizedEventType !== eventType) {
				console.warn('MiniApp: EventType contains invalid characters');
				return;
			}

			const store = getStore();

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
					const { amount, note, receiver_id, extra_attribute, receiver_name } = (eventData.eventData || {}) as any;
					dispatch(
						giveCoffeeActions.setInfoSendToken({
							sender_id: userProfile?.user?.id,
							sender_name: userProfile?.user?.username,
							receiver_id,
							amount,
							note,
							extra_attribute,
							receiver_name
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
					{
						const clanUsers = selectAllUserClans(store.getState());
						const users = [...userChannels];

						clanUsers.forEach((item) => {
							const index = users.findIndex((u) => u.id === item.id);
							if (index === -1) return;
							users[index] = { ...users[index], role_id: item.role_id };
						});

						miniAppRef.current?.contentWindow?.postMessage(
							JSON.stringify({ eventType: MiniAppEventType.CLAN_USERS_RESPONSE, eventData: users }),
							appChannel.app_url
						);
					}
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
				case MiniAppEventType.GET_CHANNELS: {
					const channels = selectAllChannels(store.getState());
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.CHANNELS_RESPONSE, eventData: channels }),
						appChannel.app_url
					);
					break;
				}
				case MiniAppEventType.GET_CHANNEL: {
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.CHANNEL_RESPONSE, eventData: appChannel }),
						appChannel.app_url
					);
					break;
				}

				case MiniAppEventType.GET_CLAN: {
					const clan = selectCurrentClan(store.getState());
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.CLAN_RESPONSE, eventData: clan }),
						appChannel.app_url
					);
					break;
				}
				case MiniAppEventType.CHECK_MICROPHONE_STATUS: {
					miniAppRef.current?.contentWindow?.postMessage(
						JSON.stringify({ eventType: MiniAppEventType.MICROPHONE_STATUS, eventData: { status: microphoneEnabled } }),
						appChannel.app_url
					);
					break;
				}
				case MiniAppEventType.TOGGLE_MICROPHONE: {
					const { on } = eventData.eventData || {};
					try {
						await toggleMicrophone(on);
					} catch (error) {
						console.error(error);
					}
					break;
				}
				default:
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [appChannel?.app_url, userProfile, allRolesInClan, userChannels, dispatch, microphoneEnabled, toggleMicrophone]);

	return { miniAppRef };
};

export default useMiniAppEventListener;
