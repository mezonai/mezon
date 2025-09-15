import { GridLayout, LiveKitRoom, ParticipantTile, RoomAudioRenderer, useLocalParticipant, useTracks } from '@livekit/components-react';
import {
	TOKEN_FAILED_STATUS,
	TOKEN_SUCCESS_STATUS,
	channelAppActions,
	generateMeetToken,
	getStore,
	giveCoffeeActions,
	handleParticipantVoiceState,
	selectAllAccount,
	selectAllRolesClan,
	selectAllUsersByUser,
	selectChannelAppChannelId,
	selectChannelAppClanId,
	selectEnableCall,
	selectEnableMic,
	selectEnableVideo,
	selectGetRoomId,
	selectInfoSendToken,
	selectLiveToken,
	selectSendTokenEvent,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Loading } from '@mezon/ui';
import type { ApiChannelAppResponseExtend } from '@mezon/utils';
import { MiniAppEventType, ParticipantMeetState } from '@mezon/utils';
import { Track } from 'livekit-client';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useMiniAppEventListener from './useMiniAppEventListener';

function AudioConference() {
	const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: true }], { onlySubscribed: false });
	return (
		<GridLayout tracks={tracks} style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}>
			<ParticipantTile />
		</GridLayout>
	);
}

export function AudiRoom({ token, serverUrl }: { token: string; serverUrl: string | undefined }) {
	const enableMic = useSelector(selectEnableMic);

	return (
		<LiveKitRoom
			video={false}
			audio={enableMic}
			token={token}
			serverUrl={serverUrl}
			data-lk-theme="empty"
			className="w-full h-full flex justify-center items-center"
		>
			<RoomAudioRenderer />
			<div
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
					backgroundColor: '#000',
					overflow: 'hidden'
				}}
			>
				<AudioConference />
				<AudioControls />
			</div>
		</LiveKitRoom>
	);
}

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
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState<boolean>(false);
	const store = getStore();

	const allRolesInClan = useSelector(selectAllRolesClan);
	const sendTokenEvent = useSelector(selectSendTokenEvent);
	const userProfile = useSelector(selectAllAccount);
	const userChannels = useAppSelector((state) => selectAllUsersByUser(state));
	const roomId = useAppSelector((state) => selectGetRoomId(state, appChannel?.channel_id));
	const enableMic = useSelector(selectEnableMic);

	const isJoinVoice = useSelector(selectEnableCall);
	const token = useSelector(selectLiveToken);

	useEffect(() => {
		const currentChannelAppClanId = selectChannelAppClanId(store.getState());
		const currentChannelAppId = selectChannelAppChannelId(store.getState());
		if (currentChannelAppId && currentChannelAppClanId) {
			dispatch(channelAppActions.setJoinChannelAppData({ dataUpdate: undefined }));
			dispatch(
				handleParticipantVoiceState({
					clan_id: currentChannelAppClanId,
					channel_id: currentChannelAppId,
					display_name: userProfile?.user?.display_name ?? '',
					state: ParticipantMeetState.LEAVE,
					room_name: roomId as string
				})
			);
		}
		dispatch(channelAppActions.setRoomId({ channelId: appChannel?.channel_id as string, roomId: null }));
		dispatch(channelAppActions.setChannelId(appChannel?.channel_id || ''));
		dispatch(channelAppActions.setClanId(appChannel?.clan_id || null));
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!roomId || !isJoinVoice) return;

			try {
				const result = await dispatch(
					generateMeetToken({
						channelId: appChannel?.channel_id as string,
						roomName: roomId
					})
				).unwrap();

				if (result) {
					dispatch(channelAppActions.setRoomToken(result));
				}
			} catch (err) {
				console.error('Failed to join room:', err);
				dispatch(channelAppActions.setRoomToken(undefined));
			}
		};

		fetchData();
	}, [roomId, isJoinVoice]);

	const getUserHashInfo = useCallback(
		async (appId: string) => {
			try {
				const response = await dispatch(channelAppActions.generateAppUserHash({ appId })).unwrap();

				return response;
			} catch (error) {
				console.error('Error:', error);
				return null;
			}
		},
		[dispatch, appChannel?.app_url]
	);

	const toggleMicrophone = useCallback(
		async (enabled: boolean) => {
			dispatch(channelAppActions.setEnableVoice(enabled));
		},
		[dispatch]
	);

	const { miniAppRef } = useMiniAppEventListener(
		appChannel,
		allRolesInClan,
		userChannels,
		userProfile,
		getUserHashInfo,
		enableMic,
		toggleMicrophone
	);

	const handleTokenResponse = () => {
		const infoSendToken = selectInfoSendToken(store.getState());

		if (sendTokenEvent?.status === TOKEN_SUCCESS_STATUS) {
			miniAppRef.current?.contentWindow?.postMessage(
				JSON.stringify({ eventType: MiniAppEventType.SEND_TOKEN_RESPONSE_SUCCESS, eventData: infoSendToken?.sender_id }),
				appChannel.app_url ?? ''
			);
		} else if (sendTokenEvent?.status === TOKEN_FAILED_STATUS) {
			miniAppRef.current?.contentWindow?.postMessage(
				JSON.stringify({ eventType: MiniAppEventType.SEND_TOKEN_RESPONSE_FAILED, eventData: infoSendToken?.sender_id }),
				appChannel.app_url ?? ''
			);
		}
	};

	useEffect(() => {
		const handleTokenListerner = () => {
			handleTokenResponse();
			dispatch(giveCoffeeActions.setSendTokenEvent(null));
			dispatch(giveCoffeeActions.setInfoSendToken(null));
		};

		if (sendTokenEvent) {
			handleTokenListerner();
		}
	}, [sendTokenEvent]);

	const participantMeetState = useCallback(
		async (state: ParticipantMeetState, channelId: string) => {
			try {
				await dispatch(
					handleParticipantVoiceState({
						clan_id: appChannel.clan_id ?? '',
						channel_id: channelId,
						display_name: userProfile?.user?.display_name ?? '',
						state,
						room_name: roomId as string
					})
				);
			} catch (err) {
				console.error('Failed to update participant state:', err);
			}
		},
		[dispatch, appChannel, userProfile?.user?.display_name]
	);

	useEffect(() => {
		if (!appChannel?.app_url) return;
		setLoading(true);

		const joinRoom = async () => {
			try {
				await participantMeetState(ParticipantMeetState.JOIN, appChannel.channel_id as string);
			} catch (err) {
				console.error('Failed to join room:', err);
			} finally {
				setLoading(false);
			}
		};

		joinRoom();
	}, [appChannel]);

	return appChannel?.app_url ? (
		<div className="relative w-full h-full rounded-b-lg">
			<div className="w-full h-full">
				<iframe
					allow="clipboard-read; clipboard-write; camera"
					ref={miniAppRef}
					title={appChannel?.app_url}
					src={buildAppUrl(appChannel)}
					className="w-full h-full rounded-b-lg"
				/>
			</div>

			{token && (
				<div className="hidden">
					<AudiRoom token={token} serverUrl={serverUrl} />
				</div>
			)}
		</div>
	) : (
		<div className="w-full h-full flex items-center justify-center rounded-b-lg">
			<Loading />
		</div>
	);
});

function AudioControls() {
	const enableVideo = useSelector(selectEnableVideo);
	const enableMic = useSelector(selectEnableMic);
	const { localParticipant } = useLocalParticipant();

	useEffect(() => {
		if (localParticipant) {
			localParticipant.setCameraEnabled(enableVideo).catch(console.error);
			localParticipant.setMicrophoneEnabled(enableMic).catch(console.error);
		}
	}, [enableVideo, enableMic, localParticipant]);

	return null;
}
