import { getTagById, useAppNavigation } from '@mezon/core';
import { categoriesActions, selectClanView, useAppDispatch } from '@mezon/store';
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
	channelLabel?: string;
	clanId?: string;
	parentId?: string;
	channelId?: string;
};

const ChannelHashtag = ({
	channelHastagId,
	isJumMessageEnabled,
	isTokenClickAble,
	parentId,
	channelLabel,
	channelId,
	clanId
}: ChannelHashtagProps) => {
	const dispatch = useAppDispatch();
	const isClanView = useSelector(selectClanView);
	const { toChannelPage, navigate } = useAppNavigation();

	const channel = getTagById(channelHastagId);
	const parentChannel = getTagById(parentId);

	const handleClick = useCallback(() => {
		if (!channel && !parentId) return;

		if (channel) {
			const channelUrl = toChannelPage(channel?.id, channel?.clan_id ?? '');
			dispatch(categoriesActions.setCtrlKFocusChannel({ id: channel?.id, parentId: channel?.parent_id ?? '' }));
			navigate(channelUrl);
			return;
		}
		if (channelId && clanId && parentId) {
			const channelUrl = toChannelPage(channelId, clanId);
			dispatch(categoriesActions.setCtrlKFocusChannel({ id: channelId, parentId }));
			navigate(channelUrl);
		}
	}, [channel, dispatch, navigate, toChannelPage]);

	const tokenClickAble = () => {
		if (!isJumMessageEnabled || isTokenClickAble) {
			handleClick();
		}
	};

	const [openUnknown, closeUnknown] = useModal(() => {
		return <ModalUnknowChannel onClose={closeUnknown} />;
	}, []);

	const isTextChannel = channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL;
	const isStreamingChannel = channel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
	const isThreadChannel = channel?.type === ChannelType.CHANNEL_TYPE_THREAD || (parentId && parentChannel);
	const isAppChannel = channel?.type === ChannelType.CHANNEL_TYPE_APP;
	const isVoiceChannel = channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;

	const existHashtagAndChannelView = channelHastagId && !isClanView;
	const isValidChannel = isTextChannel || isStreamingChannel || isThreadChannel || isVoiceChannel || existHashtagAndChannelView || isAppChannel;

	return isValidChannel ? (
		<div
			onClick={tokenClickAble}
			className={`no-underline font-medium rounded-sm  inline whitespace-nowrap cursor-pointer bg-mention color-mention${!isJumMessageEnabled ? ' hover-mention ' : `hover:none cursor-text`} `}
		>
			{isVoiceChannel ? (
				<Icons.Speaker defaultSize={`inline mt-[-0.2rem] w-4 h-4`} defaultFill="#3297FF" />
			) : isStreamingChannel ? (
				<Icons.Stream defaultSize={`inline mt-[-0.2rem] w-4 h-4`} defaultFill="#3297FF" />
			) : isAppChannel ? (
				<Icons.AppChannelIcon className={`inline mt-[-0.2rem] w-4 h-4`} />
			) : isTextChannel ? (
				!channel.channel_private || channel.channel_private === 0 ? (
					<Icons.Hashtag defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
				) : (
					<Icons.HashtagLocked defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
				)
			) : isThreadChannel ? (
				(channel && (!channel.channel_private || channel.channel_private === 0)) || parentId ? (
					<Icons.ThreadIcon defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
				) : (
					<Icons.ThreadIconLocker className={`inline-block -mt-[0.2rem] w-4 h-4 `} />
				)
			) : null}
			{channel ? channel.channel_label : channelLabel || null}
		</div>
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
