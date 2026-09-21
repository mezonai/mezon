import { getTagById, useAppNavigation } from '@mezon/core';
import {
	categoriesActions,
	getStoreAsync,
	selectChannelFetchSuccessByClanId,
	selectClanById,
	selectClanView,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelType } from 'mezon-js';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
	isLink?: boolean;
};

const ChannelHashtag = ({
	channelHastagId,
	isJumMessageEnabled,
	isTokenClickAble,
	parentId,
	channelLabel,
	channelId,
	clanId,
	isLink
}: ChannelHashtagProps) => {
	const dispatch = useAppDispatch();
	const isClanView = useSelector(selectClanView);
	const { toChannelPage, navigate } = useAppNavigation();

	const channel = getTagById(channelHastagId);
	const parentChannel = getTagById(parentId);

	const [openUnknown, closeUnknown] = useModal(() => {
		return <ModalUnknowChannel onClose={closeUnknown} />;
	}, []);

	const checkFetchChannel = useAppSelector((state) => selectChannelFetchSuccessByClanId(state, clanId || ''));
	const checkGetChannelData = checkFetchChannel && !channel;

	const handleClick = useCallback(async () => {
		const store = await getStoreAsync();
		if (clanId) {
			const clan = selectClanById(clanId)(store.getState());
			if (!clan) {
				openUnknown();
				return;
			}
			if (checkFetchChannel && !channel) {
				openUnknown();
				return;
			}
			if (!checkFetchChannel && channelHastagId) {
				const channelUrl = toChannelPage(channelHastagId, clanId);
				dispatch(categoriesActions.setCtrlKFocusChannel({ id: channelHastagId, parentId: parentId ?? '' }));
				navigate(channelUrl);
			}
		}

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
	}, [channel, checkFetchChannel, channelHastagId, dispatch, navigate, toChannelPage]);

	const tokenClickAble = () => {
		if (!isJumMessageEnabled || isTokenClickAble) {
			handleClick();
		}
	};

	const isTextChannel = channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL;
	const isStreamingChannel = channel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
	const isThreadChannel = channel?.type === ChannelType.CHANNEL_TYPE_THREAD || (parentId && parentChannel);
	const isAppChannel = channel?.type === ChannelType.CHANNEL_TYPE_APP;
	const isVoiceChannel = channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;

	const existHashtagAndChannelView = channelHastagId && !isClanView && channel?.id;
	const isValidChannel = isTextChannel || isStreamingChannel || isThreadChannel || isVoiceChannel || existHashtagAndChannelView || isAppChannel;

	return isValidChannel ? (
		<span
			onClick={tokenClickAble}
			className={`no-underline font-medium rounded-sm inline whitespace-nowrap cursor-pointer bg-mention color-mention${!isJumMessageEnabled ? ' hover-mention ' : `hover:none cursor-text`} `}
		>
			{isVoiceChannel ? (
				<Icons.Speaker defaultSize={`inline mt-[-0.2rem] w-4 h-4`} defaultFill="#3297FF" />
			) : isStreamingChannel ? (
				<Icons.Stream defaultSize={`inline mt-[-0.2rem] w-4 h-4`} defaultFill="#3297FF" />
			) : isAppChannel ? (
				<Icons.AppChannelIcon className={`inline mt-[-0.2rem] w-4 h-4`} />
			) : isTextChannel ? (
				channel?.age_restricted === 1 ? (
					<Icons.HashtagWarning defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
				) : !channel.channel_private || channel.channel_private === 0 ? (
					<Icons.Hashtag defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
				) : (
					<Icons.HashtagLocked
						defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`}
						defaultFill1="var(--bg-icon-theme)"
						defaultFill2="var(--bg-icon-theme-active)"
					/>
				)
			) : isThreadChannel ? (
				(channel && (!channel.channel_private || channel.channel_private === 0)) || parentId ? (
					<Icons.ThreadIcon defaultSize={`inline-block -mt-[0.2rem] w-4 h-4`} />
				) : (
					<Icons.ThreadIconLocker className={`inline-block -mt-[0.2rem] w-4 h-4 `} />
				)
			) : null}
			<span className="inline">{channel ? channel.channel_label : channelLabel || null}</span>
		</span>
	) : (
		<PrivateChannel onClick={handleClick} isLink={isLink} channelLabel={channelLabel} checkGetChannelData={checkGetChannelData} />
	);
};

export default memo(ChannelHashtag);
function PrivateChannel({
	onClick,
	isLink,
	channelLabel,
	checkGetChannelData
}: {
	onClick: () => void;
	isLink?: boolean;
	channelLabel?: string;
	checkGetChannelData: boolean;
}) {
	const { t } = useTranslation('message');
	return (
		<span
			onClick={onClick}
			className={`px-0.1 items-center rounded-sm inline-flex w-fit whitespace-nowrap color-mention bg-mention relative top-[3px] cursor-pointer`}
		>
			{channelLabel ? null : isLink ? <Icons.Hashtag defaultSize={`w-4 h-4`} /> : <Icons.LockedPrivate className={`w-4 h-4`} />}
			<span className={`${isLink ? 'italic' : ''}`}>
				{channelLabel && !checkGetChannelData ? channelLabel : isLink ? t('unknown') : t('noAccess')}
			</span>
		</span>
	);
}
