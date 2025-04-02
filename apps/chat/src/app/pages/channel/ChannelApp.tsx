import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, VideoConference } from '@livekit/components-react';
import {
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
	TOKEN_FAILED_STATUS,
	TOKEN_SUCCESS_STATUS,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Loading } from '@mezon/ui';
import { MiniAppEventType, ParticipantMeetState } from '@mezon/utils';
import { ApiChannelAppResponse } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import useMiniAppEventListener from './useMiniAppEventListener';

export function VideoRoom({ token, serverUrl }: { token: string; serverUrl: string | undefined }) {
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
				<VideoConference
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						objectFit: 'cover'
					}}
				/>
				<VideoControls />
			</div>
		</LiveKitRoom>
	);
}

export const ChannelApps = React.memo(({ appChannel }: { appChannel: ApiChannelAppResponse }) => {
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState<boolean>(false);
	const store = getStore();

	const allRolesInClan = useSelector(selectAllRolesClan);
	const sendTokenEvent = useSelector(selectSendTokenEvent);
	const userProfile = useSelector(selectAllAccount);
	const userChannels = useAppSelector((state) => selectAllUsersByUser(state));
	const roomId = useAppSelector((state) => selectGetRoomId(state, appChannel?.channel_id));

	const isJoinVoice = useSelector(selectEnableCall);
	const token = useSelector(selectLiveToken);

	const miniAppDataHash = useMemo(() => {
		return `userChannels=${JSON.stringify(userChannels)}`;
	}, [userChannels]);

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
					state: ParticipantMeetState.LEAVE
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
				const response = await dispatch(channelAppActions.generateAppUserHash({ appId: appId })).unwrap();

				return response;
			} catch (error) {
				console.error('Error:', error);
				return null;
			}
		},
		[dispatch, appChannel?.app_url]
	);

	const { miniAppRef } = useMiniAppEventListener(appChannel, allRolesInClan, userChannels, userProfile, getUserHashInfo);

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
						state
					})
				);
			} catch (err) {
				console.error('Failed to update participant state:', err);
			}
		},
		[dispatch, appChannel, userProfile]
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
	}, [appChannel, participantMeetState]);

	return appChannel?.app_url ? (
		<div className="relative w-full h-full rounded-b-lg">
			<div className="w-full h-full">
				<iframe
					allow="clipboard-read; clipboard-write; camera"
					ref={miniAppRef}
					title={appChannel?.app_url}
					src={`${appChannel?.app_url}#${miniAppDataHash}`}
					className="w-full h-full rounded-b-lg"
				/>
			</div>

			{token && (
				<div className="hidden">
					<VideoRoom token={token} serverUrl={serverUrl} />
				</div>
			)}
		</div>
	) : (
		<div className="w-full h-full flex items-center justify-center rounded-b-lg">
			<Loading />
		</div>
	);
});

function VideoControls() {
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
