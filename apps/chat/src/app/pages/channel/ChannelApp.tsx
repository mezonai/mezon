import { GridLayout, LiveKitRoom, ParticipantTile, RoomAudioRenderer, useLocalParticipant, useTracks } from '@livekit/components-react';
import {
	channelAppActions,
	generateMeetToken,
	getStore,
	giveCoffeeActions,
	handleParticipantVoiceState,
	selectAllAccount,
	selectChannelAppChannelId,
	selectChannelAppClanId,
	selectEnableCall,
	selectEnableMic,
	selectEnableVideo,
	selectGetRoomId,
	selectLiveToken,
	selectSendTokenEvent,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Loading } from '@mezon/ui';
import type { ApiChannelAppResponseExtend } from '@mezon/utils';
import { ParticipantMeetState } from '@mezon/utils';
import { Track } from 'livekit-client';
import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

function AudioConference() {
	const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: true }], { onlySubscribed: false });
	return (
		<GridLayout tracks={tracks} className="h-[calc(100vh-var(--lk-control-bar-height))]">
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
			<div className="relative w-full h-full bg-black overflow-hidden">
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
	const store = getStore();

	const sendTokenEvent = useSelector(selectSendTokenEvent);
	const userProfile = useSelector(selectAllAccount);
	const roomId = useAppSelector((state) => selectGetRoomId(state, appChannel?.channelId));

	const isJoinVoice = useSelector(selectEnableCall);
	const token = useSelector(selectLiveToken);

	useEffect(() => {
		const currentChannelAppClanId = selectChannelAppClanId(store.getState());
		const currentChannelAppId = selectChannelAppChannelId(store.getState());
		if (currentChannelAppId && currentChannelAppClanId) {
			dispatch(channelAppActions.setJoinChannelAppData({ dataUpdate: undefined }));
			dispatch(
				handleParticipantVoiceState({
					clanId: currentChannelAppClanId,
					channelId: currentChannelAppId,
					displayName: userProfile?.user?.displayName ?? '',
					state: ParticipantMeetState.LEAVE,
					room_name: roomId as string
				})
			);
		}
		dispatch(channelAppActions.setRoomId({ channelId: appChannel?.channelId as string, roomId: null }));
		dispatch(channelAppActions.setChannelId(appChannel?.channelId || ''));
		dispatch(channelAppActions.setClanId(appChannel?.clanId || null));
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!roomId || !isJoinVoice) return;

			try {
				const result = await dispatch(
					generateMeetToken({
						channelId: appChannel?.channelId as string,
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

	useEffect(() => {
		const handleTokenListerner = () => {
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
						clanId: appChannel.clanId ?? '',
						channelId: channelId,
						displayName: userProfile?.user?.displayName ?? '',
						state,
						room_name: roomId as string
					})
				);
			} catch (err) {
				console.error('Failed to update participant state:', err);
			}
		},
		[dispatch, appChannel, userProfile?.user?.displayName]
	);

	useEffect(() => {
		if (!appChannel?.app_url) return;

		const joinRoom = async () => {
			try {
				await participantMeetState(ParticipantMeetState.JOIN, appChannel.channelId as string);
			} catch (err) {
				console.error('Failed to join room:', err);
			}
		};

		joinRoom();
	}, [appChannel]);

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
