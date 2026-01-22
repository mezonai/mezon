import type { ChannelsEntity, SearchMessageEntity } from '@mezon/store';
import {
	getStore,
	messagesActions,
	searchMessagesActions,
	selectAllAccount,
	selectAllChannels,
	selectChannelById,
	selectMemberClanByUserId,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Pagination } from '@mezon/ui';
import type { IMessageWithUser, UsersClanEntity } from '@mezon/utils';
import { SIZE_PAGE_SEARCH } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageContextMenuProvider } from '../../ContextMenu';
import MessageWithUser from '../../MessageWithUser';
import EmptySearch from './EmptySearch';

type searchMessagesProps = {
	searchMessages: SearchMessageEntity[];
	currentPage: number;
	totalResult: number;
	channelId: string;
	isDm?: boolean;
	isLoading?: boolean;
};

type GroupedMessages = {
	label: string;
	channelId: string;
	messages: SearchMessageEntity[];
}[];

const SearchMessageChannelRender = ({ searchMessages, currentPage, totalResult, channelId, isDm, isLoading }: searchMessagesProps) => {
	const { t } = useTranslation('searchMessageChannel');
	const dispatch = useAppDispatch();
	const userId = useSelector(selectAllAccount)?.user?.id;
	const currentClanUser = useAppSelector((state) => selectMemberClanByUserId(state, userId as string));
	const messageContainerRef = useRef<HTMLDivElement>(null);
	const onPageChange = (page: number) => {
		dispatch(searchMessagesActions.setCurrentPage({ channelId, page }));
	};

	const searchChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	const channelLabelMap = useMemo(() => {
		const allChannels = selectAllChannels(getStore().getState());
		const map: Record<string, string> = {};
		allChannels.forEach((channel) => {
			if (channel.channel_id || channel.id) {
				map[channel.channel_id || channel.id] = channel.channel_label || '';
			}
		});
		return map;
	}, []);

	const groupedMessages: GroupedMessages = [];
	let currentGroup: SearchMessageEntity[] = [];
	let currentChannelId: string | null | undefined = null;

	searchMessages.forEach((message) => {
		const msgChannelId = message.channel_id ?? '';
		if (msgChannelId !== currentChannelId) {
			if (currentGroup.length > 0 && currentChannelId) {
				groupedMessages.push({
					label: channelLabelMap[currentChannelId] || currentChannelId,
					channelId: currentChannelId,
					messages: currentGroup
				});
				currentGroup = [];
			}
			currentChannelId = msgChannelId;
		}
		currentGroup.push(message);
	});

	if (currentGroup.length > 0 && currentChannelId) {
		groupedMessages.push({
			label: channelLabelMap[currentChannelId] || currentChannelId,
			channelId: currentChannelId,
			messages: currentGroup
		});
	}

	useEffect(() => {
		if (messageContainerRef.current) {
			messageContainerRef.current.scrollTop = 0;
		}
	}, [currentPage]);

	const appearanceTheme = useSelector(selectTheme);

	if (isLoading) {
		return (
			<>
				<div className="w-1 h-full bg-theme-primary"></div>
				<div className="flex flex-col w-[420px] h-full">
					<div className="flex flex-row justify-between items-center h-14 p-4 text-textLightTheme dark:text-textPrimary bg-bgLightTertiary dark:bg-bgTertiary">
						<h3 className="select-none">{t('searching')}</h3>
					</div>
					<div className="flex items-center justify-center flex-1 bg-bgLightSecondary dark:bg-bgSecondary">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-textPrimary"></div>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="w-1 h-full bg-theme-primary"></div>
			<div className="flex flex-col w-[420px] h-full">
				<div className="flex flex-row justify-between items-center h-14 p-4 text-theme-primary bg-theme-chat">
					<h3 className="select-none">{totalResult < 1 ? t('noResults') : t('resultsCount', { count: totalResult })}</h3>
				</div>
				<MessageContextMenuProvider channelId={channelId}>
					{groupedMessages.length > 0 ? (
						<div
							ref={messageContainerRef}
							className={`flex flex-col flex-1 h-full p-4 bg-outside-footer max-h-[calc(100vh_-_120px)] overflow-y-auto overflow-x-hidden ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}
						>
							<div className="flex flex-col flex-1 gap-[20px]">
								{groupedMessages.map((group, groupIndex) => {
									return (
										<div key={groupIndex} className="flex flex-col">
											{!isDm && (
												<h3 className="mb-[8px] text-theme-primary font-medium text-ellipsis whitespace-nowrap overflow-hidden">
													# {group.label}
												</h3>
											)}
											<div key={groupIndex} className="flex flex-col gap-[8px]">
												{group.messages.map((searchMessage) => (
													<SearchedItem
														key={searchMessage.message_id}
														searchChannel={searchChannel}
														searchMessage={searchMessage}
														user={currentClanUser}
													/>
												))}
											</div>
										</div>
									);
								})}
							</div>
							{totalResult > 25 && (
								<div className="mt-4 h-10">
									<Pagination
										totalPages={Math.floor(totalResult / SIZE_PAGE_SEARCH)}
										currentPage={currentPage}
										onPageChange={onPageChange}
									/>
								</div>
							)}
						</div>
					) : (
						<EmptySearch />
					)}
				</MessageContextMenuProvider>
			</div>
		</>
	);
};

interface ISearchedItemProps {
	searchMessage: SearchMessageEntity;
	searchChannel: ChannelsEntity;
	user: UsersClanEntity;
}

const SearchedItem = ({ searchMessage, searchChannel, user }: ISearchedItemProps) => {
	const { t } = useTranslation('searchMessageChannel');
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const convertedMessage = {
		...searchMessage
	} as unknown as IMessageWithUser;

	const handleClickJump = () => {
		if (!searchMessage) return;
		dispatch(
			messagesActions.jumpToMessage({
				clanId: searchMessage?.clan_id || '0',
				messageId: searchMessage?.message_id || searchMessage.id,
				channelId: searchMessage?.channel_id as string,
				navigate
			})
		);
	};

	return (
		<div className="flex items-center px-[5px] pb-[12px] bg-item-theme relative group">
			<button
				onClick={handleClickJump}
				className="absolute py-1 px-2 text-textLightTheme dark:text-textDarkTheme dark:bg-bgSecondary bg-bgLightTertiary top-[10px] z-50 right-3 text-[10px] rounded-[6px] transition-all duration-300 group-hover:block hidden"
			>
				{t('jump')}
			</button>
			<MessageWithUser
				allowDisplayShortProfile={false}
				message={convertedMessage as IMessageWithUser}
				mode={
					searchChannel?.type === ChannelType.CHANNEL_TYPE_THREAD
						? ChannelStreamMode.STREAM_MODE_THREAD
						: ChannelStreamMode.STREAM_MODE_CHANNEL
				}
				isSearchMessage={true}
				user={user}
			/>
		</div>
	);
};

export default SearchMessageChannelRender;
