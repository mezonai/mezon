import {
	ETypeFetchChannelSetting,
	channelSettingActions,
	selectMemberClanByUserId,
	selectThreadsListByParentId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons, Menu, Pagination } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { formatDistance } from 'date-fns';
import { ChannelType } from 'mezon-js';
import type { ApiChannelMessageHeader, ApiChannelSettingItem } from 'mezon-js/api.gen';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AnchorScroll } from '../../AnchorScroll/AnchorScroll';
import AvatarGroup, { AvatarCount } from '../../Avatar/AvatarGroup';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

type ListChannelSettingProp = {
	listChannel: ApiChannelSettingItem[];
	clanId: string;
	countChannel?: number;
	searchFilter?: string;
};

const ListChannelSetting = ({ listChannel, clanId, countChannel, searchFilter }: ListChannelSettingProp) => {
	const { t } = useTranslation('channelSetting');
	const parentRef = useRef(null);
	const dispatch = useAppDispatch();

	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	useEffect(() => {
		setCurrentPage(1);
	}, [clanId]);

	const onPageChange = async (page: number) => {
		setCurrentPage(page);
		await dispatch(
			channelSettingActions.fetchChannelSettingInClan({
				clanId,
				parentId: '0',
				page,
				limit: pageSize,
				typeFetch: ETypeFetchChannelSetting.MORE_CHANNEL
			})
		);
	};

	const handleChangePageSize = async (pageSizeChange: number) => {
		if (pageSizeChange === pageSize) {
			return;
		}
		setPageSize(pageSizeChange);
		setCurrentPage(1);
		if (listChannel.length < pageSizeChange) {
			await dispatch(
				channelSettingActions.fetchChannelSettingInClan({
					clanId,
					parentId: '0',
					limit: pageSizeChange,
					typeFetch: ETypeFetchChannelSetting.MORE_CHANNEL
				})
			);
		}
	};

	const menu = useMemo(() => {
		const itemMenu: ReactElement[] = [
			<Menu.Item key={'10-item'} className={'bg-item-hover'} onClick={() => handleChangePageSize(10)}>
				10
			</Menu.Item>,
			<Menu.Item key={'20-item'} className={'bg-item-hover'} onClick={() => handleChangePageSize(20)}>
				20
			</Menu.Item>,
			<Menu.Item key={'30-item'} className={'bg-item-hover'} onClick={() => handleChangePageSize(30)}>
				30
			</Menu.Item>
		];
		return <>{itemMenu}</>;
	}, [handleChangePageSize]);

	const channelListCut = useMemo(() => {
		if (!listChannel) return [];

		let start = (currentPage - 1) * pageSize;
		let end = start + pageSize;

		if (start >= listChannel.length) {
			const lastPage = Math.ceil(listChannel.length / pageSize);
			start = (lastPage - 1) * pageSize;
			end = start + pageSize;
		}

		return listChannel.slice(start, end);
	}, [listChannel, currentPage, pageSize]);
	return (
		<div className="h-full w-full flex flex-col gap-1 flex-1">
			<div className="flex flex-row justify-between items-center px-4 h-12 shadow border-b-theme-primary">
				<div className="flex-1 text-xs font-bold uppercase p-1">{t('table.columnHeaders.name')}</div>
				<div className="flex-1 text-xs font-bold uppercase p-1">{t('table.columnHeaders.members')}</div>
				<div className="flex-1 text-xs font-bold uppercase p-1">{t('table.columnHeaders.messagesCount')}</div>
				<div className="flex-1 text-xs font-bold uppercase p-1">{t('table.columnHeaders.lastSent')}</div>
				<div className="pr-1 text-xs font-bold uppercase p-1">{t('table.columnHeaders.creator')}</div>
			</div>
			<div className="flex-1">
				<AnchorScroll anchorId={clanId} ref={parentRef} className={['hide-scrollbar']} classNameChild={['!justify-start']}>
					{channelListCut.map((channel) => (
						<RenderChannelAndThread
							channelParent={channel}
							key={`group_${channel.id}`}
							clanId={clanId}
							currentPage={currentPage}
							pageSize={pageSize}
							searchFilter={searchFilter}
						/>
					))}
					<div className="flex flex-row justify-between items-center px-4 h-[54px] border-t-theme-primary mt-0">
						<div className={'flex flex-row items-center '} data-e2e={generateE2eId('clan_page.channel_management.total_channels')}>
							{t('table.pagination.show')}
							<Menu menu={menu}>
								<div className={'flex flex-row items-center justify-center text-center border-theme-primary rounded mx-1 px-3 w-12'}>
									<span className="mr-1">{pageSize}</span>
									<Icons.ArrowDown />
								</div>
							</Menu>
							{t('table.pagination.channelOf')} {countChannel}
						</div>
						<Pagination totalPages={Math.ceil((countChannel || 0) / pageSize)} currentPage={currentPage} onPageChange={onPageChange} />
					</div>
				</AnchorScroll>
			</div>
		</div>
	);
};

interface IRenderChannelAndThread {
	channelParent: ApiChannelSettingItem;
	clanId: string;
	currentPage: number;
	pageSize: number;
	searchFilter?: string;
}

const RenderChannelAndThread = ({ channelParent, clanId, currentPage, pageSize, searchFilter }: IRenderChannelAndThread) => {
	const { t } = useTranslation('channelSetting');
	const dispatch = useAppDispatch();
	const threadsList = useSelector(selectThreadsListByParentId(channelParent.id as string));

	const handleFetchThreads = () => {
		if (!threadsList) {
			dispatch(
				channelSettingActions.fetchChannelSettingInClan({
					clanId,
					parentId: channelParent.id as string,
					page: currentPage,
					limit: pageSize,
					typeFetch: ETypeFetchChannelSetting.FETCH_THREAD
				})
			);
		}
	};

	const [showThreadsList, setShowThreadsList] = useState(false);

	const toggleThreadsList = () => {
		setShowThreadsList(!showThreadsList);
	};

	const isVoiceChannel = useMemo(() => {
		return channelParent.channel_type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	}, [channelParent.channel_type]);

	const isStreamChannel = useMemo(() => {
		return channelParent.channel_type === ChannelType.CHANNEL_TYPE_STREAMING;
	}, [channelParent.channel_type]);

	return (
		<div className="flex flex-col border-b-theme-primary last:border-b-0 no-divider-last">
			<div className="relative" onClick={handleFetchThreads}>
				<ItemInfor
					creatorId={channelParent.creator_id as string}
					label={channelParent?.channel_label as string}
					privateChannel={channelParent?.channel_private as number}
					isThread={false}
					key={channelParent?.id}
					userIds={channelParent?.user_ids || []}
					channelId={channelParent?.id as string}
					isVoice={isVoiceChannel}
					messageCount={channelParent?.message_count || 0}
					lastMessage={channelParent?.last_sent_message}
					isStream={isStreamChannel}
				/>
				{!isVoiceChannel && !searchFilter && (
					<div
						onClick={toggleThreadsList}
						className={`absolute top-4 right-2 cursor-pointer transition duration-100 ease-in-out ${showThreadsList ? '' : '-rotate-90'}`}
					>
						<Icons.ArrowDown defaultSize="h-6 w-6 dark:text-[#b5bac1] text-black" />
					</div>
				)}
			</div>
			{showThreadsList && !searchFilter && (
				<div className="flex flex-col pl-8">
					{threadsList?.length > 0 ? (
						threadsList?.map((thread) => (
							<ItemInfor
								creatorId={thread?.creator_id as string}
								label={thread?.channel_label as string}
								privateChannel={thread?.channel_private as number}
								isThread={thread?.channel_type === ChannelType.CHANNEL_TYPE_THREAD}
								key={`${thread?.id}_thread`}
								userIds={thread?.user_ids || []}
								channelId={thread?.id as string}
								messageCount={thread?.message_count || 0}
								lastMessage={thread.last_sent_message}
								isVoice={thread?.channel_type === ChannelType.CHANNEL_TYPE_MEZON_VOICE}
								isStream={thread?.channel_type === ChannelType.CHANNEL_TYPE_STREAMING}
							/>
						))
					) : (
						<div
							className={`w-full py-4 relative before:content-[" "] before:w-full before:h-[0.08px]  before:absolute before:top-0 before:left-0 group text-textPrimaryLight dark:text-textPrimary`}
						>
							{t('table.threads.noThreads')}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

const ItemInfor = ({
	isThread,
	label,
	creatorId,
	privateChannel,
	userIds,
	onClick: _onClick,
	channelId,
	isVoice,
	messageCount,
	lastMessage,
	isStream
}: {
	isThread?: boolean;
	label: string;
	creatorId: string;
	privateChannel: number;
	userIds: string[];
	onClick?: (id: string) => void;
	channelId: string;
	isVoice?: boolean;
	messageCount?: number | string;
	lastMessage?: ApiChannelMessageHeader;
	isStream?: boolean;
}) => {
	const { t } = useTranslation('channelSetting');
	const creatorChannel = useAppSelector((state) => selectMemberClanByUserId(state, creatorId));
	const handleCopyChannelId = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		navigator.clipboard.writeText(channelId);
	};
	const mumberformatter = Intl.NumberFormat('en-US', {
		notation: 'compact',
		compactDisplay: 'short'
	});
	const date = lastMessage?.timestamp_seconds
		? formatDistance((lastMessage?.timestamp_seconds as number) * 1000, new Date(), { addSuffix: true })
		: null;

	const handleShowAllMemberList = () => {
		if (userIds.length > 0) {
			openModalAllMember();
		}
	};

	const [openModalAllMember, closeModalAllMember] = useModal(() => {
		return (
			<div
				className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black bg-opacity-75 z-30"
				onClick={closeModalAllMember}
			>
				<div
					className="w-450 max-h-[80vh] min-h-250  rounded-lg flex flex-col gap-2 p-4 overflow-y-auto hide-scrollbar bg-theme-setting-primary text-theme-primary"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="font-semibold pb-3 ">{t('table.memberModal.listMember')}</div>
					{userIds.map((member) => (
						<div className="flex gap-3">
							<AvatarUserShort id={member} key={member} showName={true} />
						</div>
					))}
				</div>
			</div>
		);
	}, [channelId]);

	const creatorDisplayName = creatorChannel?.clan_nick || creatorChannel?.user?.display_name || creatorChannel?.user?.username || '';
	const creatorAvatar = creatorChannel?.clan_avatar || creatorChannel?.user?.avatar_url || '';

	return (
		<div
			className={`w-full py-1 relative before:content-[" "] before:w-full before:h-[0.08px]  before:absolute before:top-0 before:left-0 group text-theme-primary `}
			onContextMenu={handleCopyChannelId}
		>
			<div
				className="cursor-pointer px-3 py-2 pr-12 flex gap-3 items-center w-full bg-item-hover"
				data-e2e={generateE2eId('clan_page.channel_management.channel_item')}
			>
				<div className="h-6 w-6">
					{!isVoice &&
						!isStream &&
						(isThread ? (
							privateChannel ? (
								<Icons.ThreadIconLocker className="w-5 h-5 " />
							) : (
								<Icons.ThreadIcon />
							)
						) : privateChannel ? (
							<Icons.HashtagLocked />
						) : (
							<Icons.Hashtag />
						))}

					{isVoice && <Icons.Speaker />}
					{isStream && <Icons.Stream />}
				</div>
				<div className={`flex-1 box-border flex overflow-hidden`}>
					<span className="truncate pr-8" data-e2e={generateE2eId('clan_page.channel_management.channel_item.channel_name')}>
						{label}
					</span>
				</div>
				<div className="flex-1 flex " onClick={handleShowAllMemberList}>
					{privateChannel || isThread ? (
						<AvatarGroup>
							{userIds.slice(0, 3).map((member) => (
								<AvatarUserShort id={member} key={member} />
							))}
							{userIds.length > 3 && <AvatarCount number={userIds.length - 3} />}
						</AvatarGroup>
					) : (
						<p className={`italic text-xs ${isThread ? '-ml-8' : ''}`}>{t('table.members.allMembers')}</p>
					)}
				</div>
				<div
					className={`flex-1 font-semibold ${isThread ? '-ml-8' : ''}`}
					data-e2e={generateE2eId('clan_page.channel_management.channel_item.messages_count')}
				>
					{mumberformatter.format(Number(messageCount || 0))}
				</div>
				<div className={`flex-1 flex gap-1 items-center`}>
					{lastMessage?.sender_id ? (
						<>
							<AvatarUserShort id={lastMessage?.sender_id as string} />
							<div>{date}</div>
						</>
					) : null}
				</div>

				<div className="overflow-hidden flex w-12 items-center justify-center">
					<AvatarImage
						title={creatorDisplayName}
						alt={creatorDisplayName}
						username={creatorDisplayName}
						src={creatorAvatar}
						srcImgProxy={createImgproxyUrl(creatorAvatar, { width: 32, height: 32, resizeType: 'fit' })}
						className="w-8 h-8 min-w-8 min-h-8 max-w-8 max-h-8"
					/>
				</div>
			</div>
		</div>
	);
};
export default ListChannelSetting;
export const AvatarUserShort = ({ id, showName = false }: { id: string; showName?: boolean }) => {
	const member = useAppSelector((state) => selectMemberClanByUserId(state, id));
	const displayName = member?.clan_nick || member?.user?.display_name || member?.user?.username || '';
	const avatarUrl = member?.clan_avatar || member?.user?.avatar_url || '';

	return (
		<div className="flex items-center gap-3" data-e2e={generateE2eId('clan_page.channel_list.item.user_list_collapsed.item')}>
			<AvatarImage
				alt={displayName || 'User avatar'}
				username={displayName}
				src={avatarUrl}
				srcImgProxy={createImgproxyUrl(avatarUrl, { width: 24, height: 24, resizeType: 'fit' })}
				className="rounded-full h-6 w-6 min-w-6 min-h-6 max-w-6 max-h-6"
			/>
			{showName ? <div className="">{displayName}</div> : null}
		</div>
	);
};
