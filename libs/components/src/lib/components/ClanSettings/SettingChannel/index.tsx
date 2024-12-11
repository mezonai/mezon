import {
	ETypeFetchChannelSetting,
	channelSettingActions,
	selectMemberClanByGoogleId,
	selectMemberClanByUserId,
	selectMemberClanByUserId2,
	selectThreadsListByParentId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, getAvatarForPrioritize } from '@mezon/utils';
import Tippy from '@tippy.js/react';
import { formatDistance } from 'date-fns';
import { Avatar, AvatarSizes, Dropdown, Pagination } from 'flowbite-react';
import { ChannelType } from 'mezon-js';
import { ApiChannelMessageHeader, ApiChannelSettingItem } from 'mezon-js/api.gen';
import { useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { AnchorScroll } from '../../AnchorScroll/AnchorScroll';

type ListChannelSettingProp = {
	listChannel: ApiChannelSettingItem[];
	clanId: string;
	countChannel?: number;
	searchFilter?: string;
};

const ListChannelSetting = ({ listChannel, clanId, countChannel, searchFilter }: ListChannelSettingProp) => {
	const parentRef = useRef(null);
	const dispatch = useAppDispatch();

	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const onPageChange = async (page: number) => {
		setCurrentPage(page);
		if (page * pageSize > listChannel.length && countChannel && listChannel.length < countChannel) {
			await dispatch(
				channelSettingActions.fetchChannelSettingInClan({
					clanId,
					parentId: '0',
					page,
					limit: pageSize,
					typeFetch: ETypeFetchChannelSetting.MORE_CHANNEL
				})
			);
		}
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

	return (
		<div className="h-full w-full flex flex-col gap-1 flex-1">
			<div className="w-full flex pl-12 pr-12 justify-between items-center h-[48px] shadow border-b-[1px] dark:border-bgTertiary text-xs dark:text-textDarkTheme text-textLightTheme font-bold uppercase">
				<span className="flex-1">Name</span>
				<span className="flex-1">Members</span>
				<span className="flex-1">Messages count</span>
				<span className="flex-1">Last Sent</span>
				<span className="pr-1">Creator</span>
			</div>
			<AnchorScroll anchorId={clanId} ref={parentRef} className={['hide-scrollbar']} classNameChild={['!justify-start']}>
				{listChannel.slice(pageSize * (currentPage - 1), pageSize * (currentPage - 1) + pageSize).map((channel) => (
					<RenderChannelAndThread
						channelParrent={channel}
						key={`group_${channel.id}`}
						clanId={clanId}
						currentPage={currentPage}
						pageSize={pageSize}
						searchFilter={searchFilter}
					/>
				))}
				<div className="flex flex-row justify-between items-center px-4 h-[54px] border-t-[1px] dark:border-borderDivider border-buttonLightTertiary mt-0">
					<div className={'flex flex-row items-center text-colorTextLightMode dark:text-textDarkTheme'}>
						Show
						<Dropdown
							value={pageSize}
							renderTrigger={() => (
								<div
									className={
										'flex flex-row items-center justify-center text-center dark:bg-slate-800 bg-slate-300 dark:text-contentTertiary text-colorTextLightMode border-[1px] dark:border-borderDivider border-buttonLightTertiary rounded mx-1 px-3 w-12'
									}
								>
									<span className="mr-1">{pageSize}</span>
									<Icons.ArrowDown />
								</div>
							)}
							label={''}
						>
							<Dropdown.Item
								className={'dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight'}
								onClick={() => handleChangePageSize(10)}
							>
								10
							</Dropdown.Item>
							<Dropdown.Item
								className={'dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight'}
								onClick={() => handleChangePageSize(20)}
							>
								20
							</Dropdown.Item>
							<Dropdown.Item
								className={'dark:hover:bg-bgModifierHover hover:bg-bgModifierHoverLight'}
								onClick={() => handleChangePageSize(30)}
							>
								30
							</Dropdown.Item>
						</Dropdown>
						channel of {countChannel}
					</div>
					<Pagination currentPage={currentPage} totalPages={Math.ceil((countChannel || 0) / pageSize)} onPageChange={onPageChange} />
				</div>
			</AnchorScroll>
		</div>
	);
};

interface IRenderChannelAndThread {
	channelParrent: ApiChannelSettingItem;
	clanId: string;
	currentPage: number;
	pageSize: number;
	searchFilter?: string;
}

const RenderChannelAndThread = ({ channelParrent, clanId, currentPage, pageSize, searchFilter }: IRenderChannelAndThread) => {
	const dispatch = useAppDispatch();
	const threadsList = useSelector(selectThreadsListByParentId(channelParrent.id as string));

	const handleFetchThreads = () => {
		if (!threadsList) {
			dispatch(
				channelSettingActions.fetchChannelSettingInClan({
					clanId,
					parentId: channelParrent.id as string,
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
		return channelParrent.channel_type === ChannelType.CHANNEL_TYPE_VOICE;
	}, [channelParrent.channel_type]);

	return (
		<div className="flex flex-col">
			<div className="relative" onClick={handleFetchThreads}>
				<ItemInfor
					creatorId={channelParrent.creator_id as string}
					label={channelParrent?.channel_label as string}
					privateChannel={channelParrent?.channel_private as number}
					isThread={channelParrent?.parent_id !== '0'}
					key={channelParrent?.id}
					userIds={channelParrent?.user_ids || []}
					channelId={channelParrent?.id as string}
					isVoice={isVoiceChannel}
					messageCount={channelParrent?.message_count || 0}
					lastMessage={channelParrent?.last_sent_message}
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
								isThread={thread?.parent_id !== '0'}
								key={`${thread?.id}_thread`}
								userIds={thread?.user_ids || []}
								channelId={thread?.id as string}
								messageCount={thread?.message_count || 0}
								lastMessage={thread.last_sent_message}
							/>
						))
					) : (
						<div
							className={`w-full py-4 relative before:content-[" "] before:w-full before:h-[0.08px] dark:before:bg-borderDivider before:bg-bgLightSecondary before:absolute before:top-0 before:left-0 group text-textPrimaryLight dark:text-textPrimary`}
						>
							There is no threads in this channel
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
	onClick,
	channelId,
	isVoice,
	messageCount,
	lastMessage
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
}) => {
	const creatorChannel = useSelector(selectMemberClanByUserId(creatorId));

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
					className="w-450 max-h-[80vh] min-h-250 dark:bg-bgTertiary bg-bgLightMode rounded-lg flex flex-col gap-2 p-4 overflow-y-auto hide-scrollbar"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="font-semibold pb-3 text-channelActiveLightColor dark:text-channelTextareaLight">List Member</div>
					{userIds.map((member) => (
						<div className="flex gap-3">
							<AvatarUserShort id={member} key={member} hiddenTooltip={true} size={'md'} showName={true} />
						</div>
					))}
				</div>
			</div>
		);
	}, [channelId]);

	const imgCreator = useMemo(() => {
		if (creatorChannel?.clan_avatar) {
			return createImgproxyUrl(creatorChannel?.clan_avatar, { width: 32, height: 32, resizeType: 'fit' });
		}
		if (creatorChannel?.user?.avatar_url) {
			return createImgproxyUrl(creatorChannel?.user?.avatar_url, { width: 32, height: 32, resizeType: 'fit' });
		}
		return 'assets/avatar-user.svg';
	}, [creatorChannel?.clan_avatar, creatorChannel?.user?.avatar_url]);

	return (
		<div
			className={`w-full py-1 relative before:content-[" "] before:w-full before:h-[0.08px] dark:before:bg-borderDivider before:bg-bgLightSecondary before:absolute before:top-0 before:left-0 group text-textPrimaryLight dark:text-textPrimary`}
			onContextMenu={handleCopyChannelId}
		>
			<div className="cursor-pointer px-3 py-2 pr-12 flex gap-3 items-center w-full dark:hover:bg-bgHover hover:bg-bgLightModeThird">
				<div className="h-6 w-6">
					{!isVoice &&
						(isThread ? (
							privateChannel ? (
								<Icons.ThreadIconLocker className="w-5 h-5 fill-textPrimary" />
							) : (
								<Icons.ThreadIcon />
							)
						) : privateChannel ? (
							<Icons.HashtagLocked />
						) : (
							<Icons.Hashtag />
						))}

					{isVoice && <Icons.Speaker />}
				</div>
				<div className={`flex-1 box-border flex overflow-hidden`}>
					<span className="truncate pr-8">{label}</span>
				</div>
				<div className="flex-1 flex " onClick={handleShowAllMemberList}>
					{privateChannel || isThread ? (
						<Avatar.Group className={`flex flex-1 items-center gap-3 ${isThread ? '-ml-8' : ''}`}>
							{userIds.slice(0, 3).map((member) => (
								<AvatarUserShort id={member} key={member} hiddenTooltip={true} />
							))}
							{userIds.length > 3 && (
								<Avatar.Counter
									total={userIds.length - 3}
									className="h-4 w-6 dark:text-textPrimary text-textPrimaryLight ring-transparent dark:bg-bgTertiary bg-bgLightTertiary dark:hover:bg-bgTertiary hover:bg-bgLightTertiary"
								/>
							)}
						</Avatar.Group>
					) : (
						<p className={`italic text-xs ${isThread ? '-ml-8' : ''}`}>(All Members)</p>
					)}
				</div>
				<div className={`flex-1 font-semibold ${isThread ? '-ml-8' : ''}`}>{mumberformatter.format(Number(messageCount || 0))}</div>
				<div className={`flex-1 flex gap-1 items-center`}>
					{lastMessage?.sender_id ? (
						<>
							<AvatarUserShort id={lastMessage?.sender_id as string} />
							<div>{date}</div>
						</>
					) : null}
				</div>

				<div className="overflow-hidden flex w-12 items-center justify-center">
					{(creatorChannel?.clan_avatar || creatorChannel?.user?.avatar_url) && (
						<Tippy
							content={
								<span>{creatorChannel?.clan_nick || creatorChannel?.user?.display_name || creatorChannel?.user?.username} </span>
							}
							placement="left"
							arrow={false}
						>
							<img src={imgCreator} className="w-8 h-8 object-cover rounded-full " />
						</Tippy>
					)}
				</div>
			</div>
		</div>
	);
};
export default ListChannelSetting;
export const AvatarUserShort = ({
	id,
	hiddenTooltip = false,
	size = 'xs',
	showName = false
}: {
	id: string;
	hiddenTooltip?: boolean;
	size?: keyof AvatarSizes;
	showName?: boolean;
}) => {
	const member = useAppSelector((state) => selectMemberClanByUserId2(state, id));
	const voiceClan = useAppSelector((state) => selectMemberClanByGoogleId(state, id ?? ''));
	const clanAvatar = voiceClan?.clan_avatar || member?.clan_avatar;
	const userAvatar = voiceClan?.user?.avatar_url || member?.user?.avatar_url;
	const avatarUrl = getAvatarForPrioritize(clanAvatar, userAvatar) || 'assets/avatar-user.svg';

	return (
		<div className="flex items-center gap-3">
			<img
				src={createImgproxyUrl(avatarUrl, { width: 24, height: 24, resizeType: 'fit' })}
				className="rounded-full h-6 aspect-square object-cover"
			/>
			{showName ? (
				<div className="text-textLightTheme dark:text-channelTextareaLight">
					{member?.clan_nick || member?.user?.display_name || member?.user?.username}
				</div>
			) : null}
		</div>
	);
};
