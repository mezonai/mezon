import { StreamLiveBadge, StreamPublisherAvatar, StreamStage, StreamViewerCount, StreamViewers, useStreamPublisher } from '@mezon/components';
import type { ChannelsEntity } from '@mezon/store';
import {
	appActions,
	fetchStreamPlayback,
	selectCurrentClanId,
	selectCurrentClanName,
	selectIsJoin,
	selectStatusStream,
	selectStreamMembersByChannelId,
	toastActions,
	useAppDispatch,
	useAppSelector,
	videoStreamActions,
	watchStream
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IStreamInfo } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type ChannelStreamProps = {
	currentStreamInfo: IStreamInfo | null;
	currentChannel: ChannelsEntity | null;
};

export default function ChannelStream({ currentStreamInfo, currentChannel }: ChannelStreamProps) {
	const { t } = useTranslation(['channelStream', 'common']);
	const dispatch = useAppDispatch();
	const channelId = currentChannel?.channel_id || '0';
	const publisher = useStreamPublisher(channelId);
	const listedViewers = useAppSelector((state) => Math.max(0, selectStreamMembersByChannelId(state, channelId).length - 1));
	const [showMembers, setShowMembers] = useState(true);
	const streamPlay = useSelector(selectStatusStream);
	const isJoin = useSelector(selectIsJoin);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanName = useSelector(selectCurrentClanName);
	const [isJoining, setIsJoining] = useState(false);
	const joinRequestRef = useRef(0);
	const currentChannelIdRef = useRef(currentChannel?.channel_id);
	const isWatching = isJoin && currentStreamInfo?.streamId === currentChannel?.channel_id;
	const streamPoster =
		currentChannel?.channel_avatar && currentChannel.channel_avatar !== '0' ? currentChannel.channel_avatar : '/assets/images/flahstream.png';

	useEffect(() => {
		currentChannelIdRef.current = currentChannel?.channel_id;
		joinRequestRef.current += 1;
		setIsJoining(false);

		return () => {
			joinRequestRef.current += 1;
		};
	}, [currentChannel?.channel_id]);

	useEffect(() => {
		if (!currentChannel || !currentClanId || !currentStreamInfo) return;
		if (currentChannel.type !== ChannelType.CHANNEL_TYPE_STREAMING) return;
		if (currentStreamInfo.streamId !== currentChannel.id || (!streamPlay && currentStreamInfo?.streamId === currentChannel.id)) {
			dispatch(appActions.setIsShowChatStream(false));
		}
	}, [currentChannel, currentStreamInfo, currentClanId, dispatch, streamPlay]);

	const handleLeaveChannel = useCallback(() => {
		joinRequestRef.current += 1;
		setIsJoining(false);
		if (isJoin && currentStreamInfo) void dispatch(watchStream({ channelId: currentStreamInfo.streamId, watching: false }));
		dispatch(videoStreamActions.resetPlayback());
		dispatch(appActions.setIsShowChatStream(false));
	}, [currentStreamInfo, dispatch, isJoin]);

	const handleJoinChannel = async () => {
		if (!currentChannel || !currentClanId) return;
		if (currentChannel.type !== ChannelType.CHANNEL_TYPE_STREAMING) return;
		if (!publisher || isJoining) return;

		const watchedId = isJoin ? currentStreamInfo?.streamId : undefined;
		const requestId = ++joinRequestRef.current;
		setIsJoining(true);
		const playback = await dispatch(fetchStreamPlayback({ channelId })).unwrap();
		if (requestId !== joinRequestRef.current || currentChannelIdRef.current !== channelId) return;
		setIsJoining(false);
		if (!playback) {
			dispatch(toastActions.addToast({ message: t('videoError'), type: 'error', autoClose: 5000 }));
			return;
		}
		dispatch(videoStreamActions.setPlayback(playback));
		dispatch(
			videoStreamActions.startStream({
				clanId: currentClanId,
				clanName: currentClanName as string,
				streamId: channelId,
				streamName: currentChannel.channel_label as string,
				parentId: currentChannel.parent_id as string
			})
		);
		dispatch(videoStreamActions.setIsJoin(true));
		if (watchedId && watchedId !== channelId) void dispatch(watchStream({ channelId: watchedId, watching: false }));
		void dispatch(watchStream({ channelId, watching: true }));
	};

	if (isWatching) {
		const membersLabel = showMembers ? t('hideMembers') : t('showMembers');
		return (
			<div className="flex h-full w-full flex-col bg-[#11111b] p-4 max-md:p-2">
				<div className="min-h-0 flex-1">
					<StreamStage channelId={channelId} poster={streamPoster} onLeave={handleLeaveChannel} />
				</div>
				{listedViewers > 0 && (
					<div className="flex shrink-0 flex-col items-center gap-2 pt-2">
						<button
							type="button"
							title={membersLabel}
							aria-label={membersLabel}
							aria-expanded={showMembers}
							onClick={() => setShowMembers((shown) => !shown)}
							className="flex items-center gap-1 rounded-3xl bg-neutral-700 px-2 py-[6px] hover:bg-bgSecondary600"
						>
							<Icons.ArrowDown
								defaultFill="white"
								className={`size-6 transition-all duration-300 ${showMembers ? '' : '-rotate-180'}`}
							/>
							<Icons.MemberList defaultFill="text-white" />
						</button>
						{showMembers && <StreamViewers channelId={channelId} />}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex h-full w-full items-center justify-center bg-gray-300 dark:bg-black">
			<div className="flex w-full max-w-md flex-col items-center gap-4 px-4 text-center">
				{publisher ? (
					<StreamPublisherAvatar publisher={publisher} className="!size-20 shrink-0" classNameText="font-semibold !text-3xl" />
				) : (
					<div className="flex size-20 items-center justify-center rounded-full bg-gray-400/40 text-gray-800 dark:bg-white/10 dark:text-white">
						<Icons.Stream defaultSize="h-10 w-10" />
					</div>
				)}
				<div className="flex max-w-full items-center gap-2">
					<span className="truncate text-3xl font-bold text-gray-800 dark:text-white">{currentChannel?.channel_label}</span>
					{publisher && <StreamLiveBadge />}
				</div>
				<p className="text-gray-800 dark:text-white">{publisher ? t('isLive', { name: publisher.name }) : t('noOneInStream')}</p>
				{publisher && <StreamViewerCount channelId={channelId} className="text-gray-700 dark:text-gray-300" />}
				{publisher && <StreamViewers channelId={channelId} />}
				{publisher && listedViewers > 0 && <p className="text-gray-800 dark:text-white">{t('everyoneWaiting')}</p>}
				<button
					type="button"
					disabled={!publisher || isJoining}
					className="w-64 max-w-full rounded-3xl bg-green-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-700"
					onClick={handleJoinChannel}
				>
					{isJoining ? t('common:joining') : t('joinStream')}
				</button>
			</div>
		</div>
	);
}
