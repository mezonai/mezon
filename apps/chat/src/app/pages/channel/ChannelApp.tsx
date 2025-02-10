import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, VideoConference } from '@livekit/components-react';
import { useAuth } from '@mezon/core';
import { handleParticipantMeetState, selectEnableMic, selectEnableVideo, selectLiveToken, useAppDispatch } from '@mezon/store';
import { Loading } from '@mezon/ui';
import { ParticipantMeetState } from '@mezon/utils';
import { ApiChannelAppResponse } from 'mezon-js/api.gen';
import { RefObject, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

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
export function ChannelApps({
	appChannel,
	miniAppRef,
	miniAppDataHash
}: {
	appChannel: ApiChannelAppResponse;
	miniAppRef: RefObject<HTMLIFrameElement>;
	miniAppDataHash: string;
}) {
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();
	const [loading, setLoading] = useState<boolean>(false);

	const token = useSelector(selectLiveToken);
	const participantMeetState = useCallback(
		async (state: ParticipantMeetState, channelId: string) => {
			try {
				await dispatch(
					handleParticipantMeetState({
						clan_id: appChannel.clan_id,
						channel_id: channelId,
						user_id: userProfile?.user?.id,
						display_name: userProfile?.user?.display_name,
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
		if (!appChannel.url) return;
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
	return appChannel?.url ? (
		<>
			<div className="w-full h-full">
				<iframe ref={miniAppRef} title={appChannel?.url} src={`${appChannel?.url}#${miniAppDataHash}`} className="w-full h-full" />
			</div>

			{token ? (
				<div className="hidden">
					<VideoRoom token={token} serverUrl={serverUrl} />
				</div>
			) : null}
		</>
	) : (
		<div className="w-full h-full flex items-center justify-center">
			<Loading />
		</div>
	);
}

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
