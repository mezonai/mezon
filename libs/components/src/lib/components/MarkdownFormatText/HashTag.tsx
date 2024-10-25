import { useAppNavigation, useTagById } from '@mezon/core';
import {
	ChannelsEntity,
	appActions,
	categoriesActions,
	channelsActions,
	selectClanView,
	selectCurrentChannel,
	selectCurrentClan,
	selectCurrentStreamInfo,
	selectStatusStream,
	selectThreadNotJoin,
	threadsActions,
	useAppDispatch,
	useAppSelector,
	videoStreamActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalUnknowChannel from './ModalUnknowChannel';

type ChannelHashtagProps = {
	channelHastagId: string;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
};

const ChannelHashtag = ({ channelHastagId, isJumMessageEnabled, isTokenClickAble }: ChannelHashtagProps) => {
	const dispatch = useAppDispatch();
	const tagId = channelHastagId?.slice(2, -1);
	const isClanView = useSelector(selectClanView);
	const [openModal, setOpenModal] = useState(false);
	const { toChannelPage, navigate } = useAppNavigation();
	const currentChannel = useSelector(selectCurrentChannel);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const playStream = useSelector(selectStatusStream);
	const clanById = useSelector(selectCurrentClan);

	let channel = useTagById(tagId);
	const thread = useAppSelector((state) => selectThreadNotJoin(state, tagId));
	if (thread) channel = thread;
	const [loading, setLoading] = useState(!channel);

	useEffect(() => {
		const fetchThreads = async () => {
			if (!(isClanView && clanById?.id && !channel && !thread)) return;
			setLoading(true);
			const threads = await dispatch(
				threadsActions.fetchThread({
					channelId: '0',
					clanId: clanById?.id,
					threadId: tagId
				})
			).unwrap();

			if (threads?.length) {
				dispatch(channelsActions.addThreadUserNotJoin(threads[0] as ChannelsEntity));
				dispatch(channelsActions.upsertOne(threads[0] as ChannelsEntity));
			}
			setLoading(false);
		};
		fetchThreads();
	}, []);

	const handleClick = useCallback(() => {
		if (!channel) return;
		if (channel.type === ChannelType.CHANNEL_TYPE_VOICE || channel?.type === ChannelType.CHANNEL_TYPE_VOICE) {
			const urlVoice = `https://meet.google.com/${channel.meeting_code}`;
			window.open(urlVoice, '_blank', 'noreferrer');
		} else {
			if (channel.type === ChannelType.CHANNEL_TYPE_STREAMING) {
				if (currentStreamInfo?.streamId !== channel.id || (!playStream && currentStreamInfo?.streamId === channel.id)) {
					dispatch(
						videoStreamActions.startStream({
							clanId: clanById?.id || '',
							clanName: clanById?.clan_name || '',
							streamId: channel?.channel_id || '',
							streamName: channel?.channel_label || '',
							parentId: channel?.parrent_id || ''
						})
					);
					dispatch(appActions.setIsShowChatStream(false));
				}
			}
			const channelUrl = toChannelPage(channel?.id, channel?.clan_id ?? '');
			dispatch(categoriesActions.setCtrlKFocusChannel({ id: channel?.id, parentId: channel?.parrent_id ?? '' }));
			navigate(channelUrl);
		}
	}, [channel, clanById, currentStreamInfo?.streamId, dispatch, navigate, playStream, toChannelPage]);

	const tokenClickAble = () => {
		if (!isJumMessageEnabled || isTokenClickAble) {
			handleClick();
		}
	};

	return loading ? (
		<span></span>
	) : channel ? (
		(currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT ||
			currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
			(channelHastagId && !isClanView)) &&
		channel ? (
			<div
				onClick={tokenClickAble}
				style={{ textDecoration: 'none' }}
				className={`font-medium px-0.1 rounded-sm  inline whitespace-nowrap !text-[#3297ff] dark:bg-[#3C4270] bg-[#D1E0FF] ${!isJumMessageEnabled ? ' hover:bg-[#5865F2] hover:!text-white cursor-pointer ' : `hover:none cursor-text`} `}
			>
				{channel.type === ChannelType.CHANNEL_TYPE_VOICE ? (
					<Icons.Speaker
						defaultSize={`inline mt-[-0.2rem] w-4 h-4  ${isJumMessageEnabled ? 'mx-[-0.4rem]' : 'mr-0.5'} `}
						defaultFill="#3297FF"
					/>
				) : channel.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
					<Icons.Stream
						defaultSize={`inline mt-[-0.2rem] w-4 h-4  ${isJumMessageEnabled ? 'mx-[-0.4rem]' : 'mr-0.5'} `}
						defaultFill="#3297FF"
					/>
				) : channel.parrent_id === '0' ? (
					<Icons.Hashtag
						defaultSize={`inline-block mt-[-0.5rem] w-4 h-4 ${isJumMessageEnabled ? 'mx-[-0.5rem]' : ''}`}
						defaultFill="#3297FF"
					/>
				) : channel.parrent_id !== '0' ? (
					<Icons.ThreadIcon
						defaultSize={`inline-block -mt-[0.2rem] w-4 h-4 ${isJumMessageEnabled ? 'mx-[-0.5rem]' : ''}`}
						defaultFill="#3297FF"
					/>
				) : null}
				{channel.channel_label}
			</div>
		) : null
	) : (
		<>
			<span
				className="font-medium px-0.1 rounded-sm cursor-pointer inline whitespace-nowrap !text-[#3297ff] hover:!text-white dark:bg-[#3C4270] bg-[#D1E0FF] hover:bg-[#5865F2] italic"
				onClick={() => setOpenModal(true)}
			>
				# unknown
			</span>
			{openModal && <ModalUnknowChannel onClose={() => setOpenModal(false)} />}
		</>
	);
};

export default memo(ChannelHashtag);
