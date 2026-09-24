import {
	appActions,
	generateMeetToken,
	selectCurrentStreamInfo,
	selectIsJoin,
	selectStreamAudioToken,
	selectStreamMembersByChannelId,
	selectStreamMuted,
	selectStreamVolume,
	useAppDispatch,
	useAppSelector,
	videoStreamActions
} from '@mezon/store';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { SfuAudioAudience, type SfuAudioAudienceState } from './MyVideoConference/Media/SfuAudioAudience';

/**
 * Keeps stream-channel SFU audio alive while the user is joined, including
 * when they navigate to another channel. ChannelStream only owns the overlay UI.
 * Empty-member reset is scoped to streamInfo.streamId; presence on other channels cannot cut this session.
 */
export function StreamAudioSession() {
	const dispatch = useAppDispatch();
	const isJoin = useSelector(selectIsJoin);
	const streamInfo = useSelector(selectCurrentStreamInfo);
	const token = useSelector(selectStreamAudioToken);
	const volume = useSelector(selectStreamVolume);
	const muted = useSelector(selectStreamMuted);
	const members = useAppSelector((state) => selectStreamMembersByChannelId(state, streamInfo?.streamId || ''));
	const serverUrl = process.env.NX_CHAT_APP_SFU_WS_URL;

	const refreshToken = useCallback(async () => {
		if (!streamInfo?.streamId) throw new Error('Stream channel is unavailable');
		const nextToken = await dispatch(
			generateMeetToken({
				channelId: streamInfo.streamId,
				roomName: ''
			})
		).unwrap();
		if (!nextToken) throw new Error('SFU audio token is empty');
		dispatch(videoStreamActions.setToken(nextToken));
		return nextToken;
	}, [dispatch, streamInfo?.streamId]);

	const handleConnectionStateChange = useCallback(
		(state: SfuAudioAudienceState) => {
			if (state !== 'failed') return;
			dispatch(videoStreamActions.resetPlayback());
			dispatch(appActions.setIsShowChatStream(false));
		},
		[dispatch]
	);

	useEffect(() => {
		if (!isJoin || !streamInfo?.streamId) return;
		if (members.length > 0) return;
		dispatch(videoStreamActions.resetPlayback());
		dispatch(appActions.setIsShowChatStream(false));
	}, [dispatch, isJoin, members.length, streamInfo?.streamId]);

	if (!isJoin || !token || !streamInfo?.streamId || !serverUrl) return null;

	return (
		<SfuAudioAudience
			token={token}
			roomId={streamInfo.streamId}
			serverUrl={serverUrl}
			volume={volume}
			muted={muted}
			onRefreshToken={refreshToken}
			onConnectionStateChange={handleConnectionStateChange}
		/>
	);
}
