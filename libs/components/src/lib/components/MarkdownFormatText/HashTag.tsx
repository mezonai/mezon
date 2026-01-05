import { getTagById, useAppNavigation } from '@mezon/core';
import { categoriesActions, selectClanView, selectCurrentChannelType, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelType } from 'mezon-js';
import { memo, useCallback } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ModalUnknowChannel from './ModalUnknowChannel';
type ChannelHashtagProps = {
	channelHastagId: string;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
};

const ChannelHashtag = ({ channelHastagId, isJumMessageEnabled, isTokenClickAble }: ChannelHashtagProps) => {
	const dispatch = useAppDispatch();
	const isClanView = useSelector(selectClanView);
	const { toChannelPage, navigate } = useAppNavigation();
	const currentChannelType = useSelector(selectCurrentChannelType);

	const channel = getTagById(channelHastagId);

	const handleClick = useCallback(() => {
		if (!channel) return;

		const channelUrl = toChannelPage(channel?.id, channel?.clanId ?? '');
		dispatch(categoriesActions.setCtrlKFocusChannel({ id: channel?.id, parentId: channel?.parentId ?? '' }));
		navigate(channelUrl);
	}, [channel, dispatch, navigate, toChannelPage]);

	const tokenClickAble = () => {
		if (!isJumMessageEnabled || isTokenClickAble) {
			handleClick();
		}
	};

	const [openUnknown, closeUnknown] = useModal(() => {
		return <ModalUnknowChannel onClose={closeUnknown} />;
	}, []);

	const isTextChannel = currentChannelType === ChannelType.CHANNEL_TYPE_CHANNEL;
	const isStreamingChannel = currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING;
	const isThreadChannel = currentChannelType === ChannelType.CHANNEL_TYPE_THREAD;
	const isAppChannel = currentChannelType === ChannelType.CHANNEL_TYPE_APP;
	const isVoiceChannel = currentChannelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE;

	const existHashtagAndChannelView = channelHastagId && !isClanView;
	const isValidChannel =
		(isTextChannel || isStreamingChannel || isThreadChannel || isVoiceChannel || existHashtagAndChannelView || isAppChannel) && channel;

	return channel ? (
		isValidChannel ? (
			<div
				onClick={tokenClickAble}
				className={`no-underline font-medium rounded-sm  inline whitespace-nowrap cursor-pointer bg-mention color-mention${!isJumMessageEnabled ? ' hover-mention ' : `hover:none cursor-text`} `}
			>
				{channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE ? (
					<Icons.Speaker defaultSize={`inline mt-[-0.2rem] w-4 h-4`} defaultFill="#3297FF" />
				) : channel.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
					<Icons.Stream defaultSize={`inline mt-[-0.2rem] w-4 h-4`} defaultFill="#3297FF" />
				) : channel.type === ChannelType.CHANNEL_TYPE_APP ? (
					<Icons.AppChannelIcon className={`inline mt-[-0.2rem] w-4 h-4`} />
				) : channel.type === ChannelType.CHANNEL_TYPE_CHANNEL ? (
					!channel.channelPrivate || channel.channelPrivate === 0 ? (
						<Icons.Hashtag defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
					) : (
						<Icons.HashtagLocked defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
					)
				) : channel.type === ChannelType.CHANNEL_TYPE_THREAD ? (
					!channel.channelPrivate || channel.channelPrivate === 0 ? (
						<Icons.ThreadIcon defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
					) : (
						<Icons.ThreadIconLocker className={`inline-block -mt-[0.2rem] w-4 h-4 `} />
					)
				) : null}
				{channel.channelLabel}
			</div>
		) : null
	) : (
		<PrivateChannel onClick={openUnknown} />
	);
};

export default memo(ChannelHashtag);
function PrivateChannel({ onClick }: { onClick: () => void }) {
	return (
		<span
			onClick={onClick}
			className={`px-0.1 rounded-sm inline-flex w-fit whitespace-nowrap color-mention bg-mention relative top-[3px] cursor-pointer`}
		>
			<Icons.LockedPrivate className={`mt-1 w-4 h-4`} />
			<span>private-channel</span>
		</span>
	);
}
