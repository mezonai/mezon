import { getTagById, useAppNavigation } from '@mezon/core';
import {
	categoriesActions,
	getStore,
	getStoreAsync,
	listChannelsByUserActions,
	putFetchedChannel,
	selectChannelDetailById,
	selectChannelFetchSuccessByClanId,
	selectClanById,
	selectClanExists,
	selectClanView,
	subscribeChannelDetail,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ModalUnknowChannel from './ModalUnknowChannel';
type ChannelHashtagProps = {
	channelHastagId: string;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
	channelLabel?: string;
	channelType?: number;
	channelPrivate?: number;
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
	channelType,
	channelPrivate,
	channelId,
	clanId,
	isLink
}: ChannelHashtagProps) => {
	const dispatch = useAppDispatch();
	const isClanView = useSelector(selectClanView);
	const { toChannelPage, navigate } = useAppNavigation();

	const storedChannel = getTagById(channelHastagId);
	const clanExist = useAppSelector((state) => selectClanExists(state, clanId || storedChannel?.clan_id || ''));
	const checkFetchChannel = useAppSelector((state) => selectChannelFetchSuccessByClanId(state, clanId || ''));
	const metaVisible =
		channelType === ChannelType.CHANNEL_TYPE_THREAD ? !!parentId && !!getTagById(parentId) && !channelPrivate : !checkFetchChannel;
	const sentChannel = useMemo<IChannel | undefined>(
		() =>
			metaVisible && channelType !== undefined && channelLabel && clanId && clanExist
				? {
						id: channelHastagId,
						channel_id: channelHastagId,
						channel_label: channelLabel,
						channel_private: channelPrivate,
						clan_id: clanId,
						parent_id: parentId,
						type: channelType
					}
				: undefined,
		[metaVisible, channelHastagId, channelLabel, channelType, channelPrivate, clanId, parentId, clanExist]
	);
	const subscribeDetail = useCallback((onChange: () => void) => subscribeChannelDetail(channelHastagId, onChange), [channelHastagId]);
	const readDetail = useCallback(() => selectChannelDetailById(getStore().getState(), channelHastagId), [channelHastagId]);
	const channelDetail = useSyncExternalStore(subscribeDetail, readDetail);
	const channel = storedChannel || sentChannel || channelDetail;
	const parentChannel = getTagById(parentId);
	const threadNeedsDetail = channelType === ChannelType.CHANNEL_TYPE_THREAD && clanExist && !storedChannel && !metaVisible;

	const [openUnknown, closeUnknown] = useModal(() => {
		return <ModalUnknowChannel onClose={closeUnknown} />;
	}, []);

	const checkGetChannelData = checkFetchChannel && !channel;

	const handleClick = useCallback(async () => {
		const store = await getStoreAsync();
		if (clanId) {
			const clan = selectClanById(clanId)(store.getState());
			if (!clan) {
				openUnknown();
				return;
			}
			if (!channel && threadNeedsDetail && channelDetail === undefined && channelHastagId) {
				const action = await dispatch(listChannelsByUserActions.fetchChannelDetail({ channelId: channelHastagId }));
				const detail = listChannelsByUserActions.fetchChannelDetail.fulfilled.match(action)
					? action.payload
					: selectChannelDetailById(getStore().getState(), channelHastagId);
				if (detail === undefined) return;
				if (!detail) {
					openUnknown();
					return;
				}
				const detailClanId = detail.clan_id && detail.clan_id !== '0' ? detail.clan_id : clanId;
				const opened = putFetchedChannel(dispatch, detailClanId, detail);
				dispatch(categoriesActions.setCtrlKFocusChannel({ id: opened.id, parentId: opened.parent_id ?? '' }));
				navigate(toChannelPage(opened.id, detailClanId));
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
	}, [channel, channelDetail, checkFetchChannel, channelHastagId, dispatch, navigate, threadNeedsDetail, toChannelPage]);

	const tokenClickAble = () => {
		if (!isJumMessageEnabled || isTokenClickAble) {
			handleClick();
		}
	};

	const isTextChannel = channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL;
	const isStreamingChannel = channel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
	const isThreadChannel = channel?.type === ChannelType.CHANNEL_TYPE_THREAD || (metaVisible && parentId && parentChannel);
	const isAppChannel = channel?.type === ChannelType.CHANNEL_TYPE_APP;
	const isVoiceChannel = channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;

	const existHashtagAndChannelView = channelHastagId && !isClanView && channel?.id;
	const isValidChannel =
		clanExist && (isTextChannel || isStreamingChannel || isThreadChannel || isVoiceChannel || existHashtagAndChannelView || isAppChannel);

	return isValidChannel ? (
		<span
			onClick={tokenClickAble}
			className={`no-underline font-medium rounded-sm inline whitespace-nowrap cursor-pointer bg-mention color-mention${!isJumMessageEnabled ? ' hover-mention ' : `hover:none cursor-text`} `}
		>
			{isVoiceChannel ? (
				channel.channel_private ? (
					<MezonIcon icon={MzIcons16.mzSpeakerLock} className={`inline mt-[-0.2rem]`} />
				) : (
					<MezonIcon icon={MzIcons16.mzSpeaker} className={`inline mt-[-0.2rem]`} />
				)
			) : isStreamingChannel ? (
				<MezonIcon icon={MzIcons16.mzLive} className={`inline mt-[-0.2rem] text-[#3297FF]`} />
			) : isAppChannel ? (
				<MezonIcon icon={MzIcons16.mzChannelApp} className={`inline mt-[-0.2rem]`} />
			) : isTextChannel ? (
				channel?.age_restricted === 1 ? (
					<MezonIcon icon={MzIcons16.mzChannelWarning} className={`inline-block -mt-[0.2rem]`} />
				) : !channel.channel_private || channel.channel_private === 0 ? (
					<MezonIcon icon={MzIcons16.mzChannel} className={`inline-block -mt-[0.2rem]`} />
				) : (
					<MezonIcon icon={MzIcons16.mzChannelPrivate} className={`inline-block -mt-[0.2rem] text-[var(--mz-icon)]`} />
				)
			) : isThreadChannel ? (
				(channel && (!channel.channel_private || channel.channel_private === 0)) || parentId ? (
					<MezonIcon icon={MzIcons16.mzThread} className={`inline-block -mt-[0.2rem]`} />
				) : (
					<MezonIcon icon={MzIcons16.mzThreadPrivate} className={`inline-block -mt-[0.2rem]`} />
				)
			) : null}
			<span className="inline">{channel ? channel.channel_label : channelLabel || null}</span>
		</span>
	) : (
		<PrivateChannel
			onClick={handleClick}
			isLink={isLink}
			channelLabel={clanExist && metaVisible ? channelLabel : ''}
			checkGetChannelData={checkGetChannelData}
		/>
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
			{channelLabel ? null : <MezonIcon icon={MzIcons16.mzLock} />}
			<span className={`${isLink ? 'italic' : ''}`}>{channelLabel && !checkGetChannelData ? channelLabel : t('noAccess')}</span>
		</span>
	);
}
