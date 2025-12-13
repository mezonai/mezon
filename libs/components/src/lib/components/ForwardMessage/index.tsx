import { useAuth, useDirect, useSendForwardMessage } from '@mezon/core';
import type { DirectEntity, MessagesEntity } from '@mezon/store';
import {
	EStateFriend,
	channelsActions,
	getIsFowardAll,
	getSelectedMessage,
	getStore,
	selectAllChannelMembers,
	selectAllChannelsByUser,
	selectAllDirectMessages,
	selectAllFriends,
	selectAllUserClans,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectDmGroupCurrentId,
	selectLoadingStatus,
	selectModeResponsive,
	toggleIsShowPopupForwardFalse,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ChannelThreads, UsersClanEntity } from '@mezon/utils';
import {
	FOR_1_HOUR_SEC,
	ModeResponsive,
	TypeSearch,
	addAttributesSearchList,
	getAvatarForPrioritize,
	isFileAttachment,
	isImageFileType,
	isVideoFileType,
	normalizeString,
	removeDuplicatesById
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';
import MessageContent from '../MessageWithUser/MessageContent';
import ListSearchForwardMessage from './ListSearchForwardMessage';

type ObjectSend = {
	id: string;
	type: number;
	clanId?: string;
	channelLabel?: string;
	isPublic: boolean;
	isFriend?: boolean;
};
const ForwardMessageModal = () => {
	const { t } = useTranslation('forwardMessage');
	const dispatch = useAppDispatch();
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const listChannels = useSelector(selectAllChannelsByUser);
	const isLoading = useSelector(selectLoadingStatus);
	const listGroup = dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_GROUP);
	const listDM = dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM);
	const { sendForwardMessage } = useSendForwardMessage();
	const { createDirectMessageWithUser } = useDirect();
	const { userProfile } = useAuth();
	const selectedMessage = useSelector(getSelectedMessage);
	const accountId = userProfile?.user?.id ?? '';
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const modeResponsive = useSelector(selectModeResponsive);
	const membersInClan = useAppSelector((state) => selectAllChannelMembers(state, currentChannelId as string));
	const isForwardAll = useSelector(getIsFowardAll);
	const [selectedObjectIdSends, setSelectedObjectIdSends] = useState<ObjectSend[]>([]);
	const [searchText, setSearchText] = useState('');
	const [forwardMessage, setForwardMessage] = useState('');

	const remainingChars = 2000 - forwardMessage.length;
	const isMessageTooLong = forwardMessage.length > 2000;

	const allFriends = useSelector(selectAllFriends);
	const currentChannel = useSelector(selectCurrentChannel);

	useEffect(() => {
		if (isLoading === 'loaded') {
			dispatch(channelsActions.openCreateNewModalChannel({ isOpen: false, clanId: currentChannel?.clan_id as string }));
		}
	}, [dispatch, isLoading, currentChannel?.clan_id]);

	const handleCloseModal = () => {
		dispatch(toggleIsShowPopupForwardFalse());
	};
	const handleToggle = (id: string, type: number, isPublic: boolean, clanId?: string, channelLabel?: string, isFriend?: boolean) => {
		const existingIndex = selectedObjectIdSends.findIndex((item) => item.id === id && item.type === type);
		if (existingIndex !== -1) {
			setSelectedObjectIdSends((prevItems) => [...prevItems.slice(0, existingIndex), ...prevItems.slice(existingIndex + 1)]);
		} else {
			setSelectedObjectIdSends((prevItems) => [...prevItems, { id, type, clanId, channelLabel, isPublic, isFriend }]);
		}
	};

	const handleForward = () => {
		return isForwardAll ? handleForwardAllMessage() : sentToMessage();
	};

	const sendMultipleMessages = async (combineMessages: MessagesEntity[], clanId: string, channelId: string, mode: number, isPublic: boolean) => {
		for (let i = 0; i < combineMessages.length; i++) {
			const message = combineMessages[i];
			const isLastMessage = i === combineMessages.length - 1;
			await sendForwardMessage(
				clanId,
				channelId,
				mode,
				isPublic,
				{
					...message,
					references: []
				},
				isLastMessage ? forwardMessage : undefined
			);
		}
	};

	const handleDirectMessageForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		let channelId = selectedObjectIdSend.id;

		if (selectedObjectIdSend.isFriend) {
			const friend = allFriends.find((f) => f?.user?.id === selectedObjectIdSend.id);
			if (!friend?.user?.id) return;

			const response = await createDirectMessageWithUser(
				friend.user.id,
				friend.user.display_name || friend.user.username,
				friend.user.username,
				friend.user.avatar_url
			);

			if (!response?.channel_id) return;
			channelId = response.channel_id;
		}

		await sendMultipleMessages(combineMessages, '', channelId, ChannelStreamMode.STREAM_MODE_DM, false);
	};

	const handleGroupForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		await sendMultipleMessages(combineMessages, '', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_GROUP, false);
	};

	const handleChannelForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		await sendMultipleMessages(
			combineMessages,
			selectedObjectIdSend.clanId || '',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_CHANNEL,
			currentChannel ? !currentChannel.channel_private : false
		);
	};

	const handleThreadForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		await sendMultipleMessages(
			combineMessages,
			selectedObjectIdSend.clanId || '',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_THREAD,
			currentChannel ? !currentChannel.channel_private : false
		);
	};

	const forwardAllToSingleDestination = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		switch (selectedObjectIdSend.type) {
			case ChannelType.CHANNEL_TYPE_DM:
				await handleDirectMessageForwardAll(selectedObjectIdSend, combineMessages);
				break;
			case ChannelType.CHANNEL_TYPE_GROUP:
				await handleGroupForwardAll(selectedObjectIdSend, combineMessages);
				break;
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				await handleChannelForwardAll(selectedObjectIdSend, combineMessages);
				break;
			case ChannelType.CHANNEL_TYPE_THREAD:
				await handleThreadForwardAll(selectedObjectIdSend, combineMessages);
				break;
			default:
				break;
		}
	};

	const handleForwardAllMessage = async () => {
		const store = getStore();
		const state = store.getState();
		const channelMessageEntity =
			state.messages.channelMessages?.[(modeResponsive === ModeResponsive.MODE_CLAN ? currentChannelId : currentDmId) || ''];
		if (!channelMessageEntity) return;

		const allMessageIds = channelMessageEntity.ids;
		const allMessagesEntities = channelMessageEntity.entities;
		const startIndex = allMessageIds.findIndex((id) => id === selectedMessage.id);

		const combineMessages: MessagesEntity[] = [];
		combineMessages.push(selectedMessage);

		let index = startIndex + 1;
		while (
			index < allMessageIds.length &&
			Date.parse(allMessagesEntities?.[allMessageIds[index]]?.create_time) -
				Date.parse(allMessagesEntities?.[allMessageIds[index]]?.create_time) <
				FOR_1_HOUR_SEC &&
			allMessagesEntities?.[allMessageIds[index]]?.sender_id === selectedMessage?.user?.id
		) {
			combineMessages.push(allMessagesEntities?.[allMessageIds[index]]);
			index++;
		}

		for (const selectedObjectIdSend of selectedObjectIdSends) {
			await forwardAllToSingleDestination(selectedObjectIdSend, combineMessages);
		}

		dispatch(toggleIsShowPopupForwardFalse());
	};

	const handleDirectMessageForward = async (selectedObjectIdSend: ObjectSend) => {
		if (selectedObjectIdSend.isFriend) {
			const friend = allFriends.find((f) => f?.user?.id === selectedObjectIdSend.id);
			if (!friend?.user?.id) return;

			const response = await createDirectMessageWithUser(
				friend.user.id,
				friend.user.display_name || friend.user.username,
				friend.user.username,
				friend.user.avatar_url
			);

			if (!response?.channel_id) return;

			await sendForwardMessage(
				'',
				response.channel_id,
				ChannelStreamMode.STREAM_MODE_DM,
				false,
				{
					...selectedMessage,
					references: []
				},
				forwardMessage
			);
			return;
		}

		await sendForwardMessage(
			'',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_DM,
			false,
			{
				...selectedMessage,
				references: []
			},
			forwardMessage
		);
	};

	const handleGroupForward = async (selectedObjectIdSend: ObjectSend) => {
		await sendForwardMessage(
			'',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_GROUP,
			false,
			{
				...selectedMessage,
				references: []
			},
			forwardMessage
		);
	};

	const handleChannelForward = async (selectedObjectIdSend: ObjectSend) => {
		await sendForwardMessage(
			selectedObjectIdSend.clanId || '',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_CHANNEL,
			selectedObjectIdSend.isPublic,
			{ ...selectedMessage, references: [] },
			forwardMessage
		);
	};

	const handleThreadForward = async (selectedObjectIdSend: ObjectSend) => {
		await sendForwardMessage(
			selectedObjectIdSend.clanId || '',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_THREAD,
			selectedObjectIdSend.isPublic,
			{ ...selectedMessage, references: [] },
			forwardMessage
		);
	};

	const forwardToSingleDestination = async (selectedObjectIdSend: ObjectSend) => {
		switch (selectedObjectIdSend.type) {
			case ChannelType.CHANNEL_TYPE_DM:
				await handleDirectMessageForward(selectedObjectIdSend);
				break;
			case ChannelType.CHANNEL_TYPE_GROUP:
				await handleGroupForward(selectedObjectIdSend);
				break;
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				await handleChannelForward(selectedObjectIdSend);
				break;
			case ChannelType.CHANNEL_TYPE_THREAD:
				await handleThreadForward(selectedObjectIdSend);
				break;
			default:
				break;
		}
	};

	const sentToMessage = async () => {
		for (const selectedObjectIdSend of selectedObjectIdSends) {
			await forwardToSingleDestination(selectedObjectIdSend);
		}
		dispatch(toggleIsShowPopupForwardFalse());
	};

	const usersClan = useSelector(selectAllUserClans);
	const friends = useSelector(selectAllFriends);

	const blockedUserIds = useMemo(() => {
		return new Set(friends.filter((friend) => friend.state === EStateFriend.BLOCK).map((friend) => friend.id));
	}, [friends]);

	const listMemSearch = useMemo(() => {
		const listDMSearch = listDM.length
			? listDM
					.filter((itemDM) => !blockedUserIds.has(itemDM?.user_ids?.[0] ?? ''))
					.map((itemDM: DirectEntity) => {
						return {
							id: itemDM?.user_ids?.[0] ?? '',
							name: itemDM?.usernames?.toString() ?? '',
							avatarUser: itemDM?.avatars?.[0] ?? '',
							idDM: itemDM?.id ?? '',
							typeChat: ChannelType.CHANNEL_TYPE_DM,
							displayName: itemDM.channel_label,
							lastSentTimeStamp: itemDM.last_sent_message?.timestamp_seconds,
							typeSearch: TypeSearch.Dm_Type
						};
					})
			: [];
		const listGroupSearch = listGroup.length
			? listGroup.map((itemGr: DirectEntity) => {
					return {
						id: itemGr?.channel_id ?? '',
						name: itemGr?.channel_label ?? '',
						avatarUser: itemGr?.channel_avatar || 'assets/images/avatar-group.png',
						idDM: itemGr?.id ?? '',
						typeChat: ChannelType.CHANNEL_TYPE_GROUP,
						displayName: itemGr.channel_label,
						lastSentTimeStamp: itemGr.last_sent_message?.timestamp_seconds,
						typeSearch: TypeSearch.Dm_Type
					};
				})
			: [];

		const listUserClanSearch = usersClan.length
			? usersClan.map((itemUserClan: UsersClanEntity) => {
					return {
						id: itemUserClan?.id ?? '',
						name: itemUserClan?.user?.username ?? '',
						avatarUser: getAvatarForPrioritize(itemUserClan.clan_avatar, itemUserClan?.user?.avatar_url),
						displayName: itemUserClan?.user?.display_name ?? '',
						clanNick: itemUserClan?.clan_nick ?? '',
						lastSentTimeStamp: '0',
						idDM: '',
						type: TypeSearch.Dm_Type
					};
				})
			: [];

		const listFriendsSearch = allFriends.length
			? allFriends
					.filter((friend) => friend.state === EStateFriend.FRIEND && !blockedUserIds.has(friend?.user?.id ?? ''))
					.map((friend) => {
						return {
							id: friend?.user?.id ?? '',
							name: friend?.user?.username ?? '',
							avatarUser: friend?.user?.avatar_url ?? '',
							idDM: friend?.user?.id ?? '',
							typeChat: ChannelType.CHANNEL_TYPE_DM,
							displayName: friend?.user?.display_name ?? friend?.user?.username ?? '',
							lastSentTimeStamp: '0',
							typeSearch: TypeSearch.Dm_Type,
							isFriend: true,
							prioritizeName: friend?.user?.display_name ?? friend?.user?.username ?? ''
						};
					})
			: [];

		const usersClanMap = new Map(listUserClanSearch.filter((user) => !blockedUserIds.has(user.id)).map((user) => [user.id, user]));

		const listSearch = [
			...listDMSearch.map((itemDM) => {
				const user = usersClanMap.get(itemDM.id);
				return user
					? {
							...itemDM,
							clanNick: user.clanNick || '',
							displayName: user.displayName || itemDM.displayName,
							avatarUser: user.avatarUser || ''
						}
					: itemDM;
			}),
			...listGroupSearch,
			...listFriendsSearch.filter((friend) => !listDMSearch.some((dm) => dm.id === friend.id))
		];
		return removeDuplicatesById(listSearch.filter((item) => item.id !== accountId).filter((item) => !blockedUserIds.has(item.id)));
	}, [accountId, listDM, listGroup, usersClan, blockedUserIds, allFriends]);

	const listChannelSearch = useMemo(() => {
		const listChannelForward = listChannels.filter(
			(channel) => channel.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel.type === ChannelType.CHANNEL_TYPE_THREAD
		);
		const list = listChannelForward.map((item: ChannelThreads) => {
			return {
				id: item?.id ?? '',
				name: item?.channel_label ?? '',
				subText: item?.category_name ?? '',
				icon: '#',
				type: item?.type ?? '',
				clanId: item?.clan_id ?? '',
				channelLabel: item?.channel_label ?? '',
				lastSentTimeStamp: item.last_sent_message?.timestamp_seconds,
				typeSearch: TypeSearch.Channel_Type,
				prioritizeName: item?.channel_label ?? '',
				isPublic: item ? !item.channel_private : false
			};
		});
		return list;
	}, [listChannels]);

	const addPropsIntoListMember = useMemo(() => addAttributesSearchList(listMemSearch, membersInClan), [listMemSearch, membersInClan]);
	const totalsSearch = [...addPropsIntoListMember, ...listChannelSearch];

	const normalizedSearchText = normalizeString(searchText);

	const isNoResult = useMemo(() => {
		const memberResults = addPropsIntoListMember.some(
			(item) =>
				(item.prioritizeName && item.prioritizeName.toUpperCase().includes(normalizedSearchText)) ||
				(typeof item.name === 'string' && item.name.toUpperCase().includes(normalizedSearchText)) ||
				(Array.isArray(item.name) && item.name[0].toUpperCase().includes(normalizedSearchText))
		);
		const channelResults = listChannelSearch.some(
			(item) => item.prioritizeName && item.prioritizeName.toUpperCase().includes(normalizedSearchText)
		);
		return !memberResults && !channelResults;
	}, [addPropsIntoListMember, listChannelSearch, normalizedSearchText]);

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
		}
	};

	return (
		<ModalLayout onClose={handleCloseModal}>
			<div className="bg-theme-setting-primary w-[550px] text-theme-primary pt-4 rounded">
				<div>
					<h1 className=" text-xl font-semibold text-center">{t('modal.title')}</h1>
				</div>
				<div className="px-4 pt-4">
					<input
						type="text"
						className=" bg-theme-input outline-none w-full h-10 p-[10px] border-theme-primary text-base rounded-lg "
						placeholder={t('modal.searchPlaceholder')}
						onChange={(e) => setSearchText(e.target.value)}
						onKeyDown={(e) => handleInputKeyDown(e)}
					/>
					<div className={`mt-4 mb-2 overflow-y-auto h-[300px] thread-scroll `}>
						{!normalizedSearchText.startsWith('@') && !normalizedSearchText.startsWith('#') ? (
							<>
								<ListSearchForwardMessage
									listSearch={totalsSearch}
									searchText={normalizedSearchText}
									selectedObjectIdSends={selectedObjectIdSends}
									handleToggle={handleToggle}
								/>
								{isNoResult && <span className=" flex flex-row justify-center ">{t('modal.noResults')}</span>}
							</>
						) : (
							<>
								{normalizedSearchText.startsWith('@') && (
									<>
										<span className=" text-left opacity-60 text-[11px] pb-1 uppercase">{t('modal.searchFriendsUsers')}</span>
										<ListSearchForwardMessage
											listSearch={addPropsIntoListMember}
											searchText={searchText.slice(1)}
											selectedObjectIdSends={selectedObjectIdSends}
											handleToggle={handleToggle}
										/>
									</>
								)}
								{normalizedSearchText.startsWith('#') && (
									<>
										<span className=" text-left opacity-60 text-[11px] pb-1 uppercase">{t('modal.searchingChannel')}</span>
										<ListSearchForwardMessage
											listSearch={listChannelSearch}
											searchText={normalizedSearchText.slice(1)}
											selectedObjectIdSends={selectedObjectIdSends}
											handleToggle={handleToggle}
										/>
									</>
								)}
							</>
						)}
					</div>
				</div>
				<div className="px-4">
					<div className="mb-2 flex items-center gap-2">
						<label htmlFor="clearAfter" className="text-xs uppercase font-semibold text-theme-primary">
							{t('modal.sharedContent')}
						</label>
					</div>

					<div className="bg-item-theme  p-3 flex items-center justify-between gap-3 border-l-4 border-[var(--text-theme-primary)]">
						<div className="flex-1 min-w-0">
							{selectedMessage?.content?.t && (
								<div className="max-h-12 overflow-hidden text-sm text-theme-primary mb-2 line-clamp-2">
									<MessageContent message={selectedMessage} />
								</div>
							)}

							{selectedMessage?.attachments &&
								selectedMessage.attachments.length > 0 &&
								(() => {
									const images = selectedMessage.attachments.filter((a) => isImageFileType(a.filetype));
									const videos = selectedMessage.attachments.filter((a) => isVideoFileType(a.filetype));
									const files = selectedMessage.attachments.filter((a) => isFileAttachment(a.filetype));

									const imageCount = images.length > 99 ? '99+' : images.length;
									const videoCount = videos.length > 99 ? '99+' : videos.length;
									const fileCount = files.length > 99 ? '99+' : files.length;

									return (
										<div className="flex flex-col gap-1 text-xs text-theme-primary opacity-60">
											{images.length > 0 && (
												<div className="flex items-center gap-1.5">
													<Icons.ImageUploadIcon className="w-4 h-4" />
													<span>
														{imageCount} {images.length === 1 ? t('modal.image') : t('modal.images')}
													</span>
												</div>
											)}
											{videos.length > 0 && (
												<div className="flex items-center gap-1.5">
													<Icons.PlayButton className="w-4 h-4" />
													<span>
														{videoCount} {videos.length === 1 ? t('modal.video') : t('modal.videos')}
													</span>
												</div>
											)}
											{files.length > 0 && (
												<div className="flex items-center gap-1.5">
													<Icons.FileIcon className="w-4 h-4" />
													<span>
														{fileCount} {files.length === 1 ? t('modal.file') : t('modal.files')}
													</span>
												</div>
											)}
										</div>
									);
								})()}
						</div>
						;|
						{selectedMessage?.attachments &&
							selectedMessage.attachments.length > 0 &&
							(() => {
								const firstImage = selectedMessage.attachments.find((a) => isImageFileType(a.filetype));
								const firstVideo = selectedMessage.attachments.find((a) => isVideoFileType(a.filetype));
								const attachment = firstImage || firstVideo;

								if (attachment) {
									const isVideo = isVideoFileType(attachment.filetype);
									return (
										<div className="relative w-20 h-20 rounded overflow-hidden bg-theme-input flex-shrink-0">
											{isVideo ? (
												<>
													<video src={attachment.url} className="w-full h-full object-cover" />
													<div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
														<Icons.PlayButton className="w-8 h-8 text-white" />
													</div>
												</>
											) : (
												<img
													src={attachment.url}
													alt={attachment.filename || 'attachment'}
													className="w-full h-full object-cover"
												/>
											)}
											{selectedMessage.attachments.length > 1 && (
												<div className="absolute bottom-1 right-1 bg-black/70 rounded-full w-6 h-6 flex items-center justify-center text-[10px] text-white font-semibold">
													+{selectedMessage.attachments.length - 1}
												</div>
											)}
										</div>
									);
								}
								return null;
							})()}
					</div>

					<div className="mt-4 mb-2 flex items-center justify-between">
						<label htmlFor="forwardMessage" className="text-xs uppercase font-semibold text-theme-primary">
							{t('modal.additionalMessage')}
						</label>
						{forwardMessage.length > 1800 && (
							<span
								className={`text-xs font-semibold ${
									isMessageTooLong ? 'text-red-500' : remainingChars < 100 ? 'text-yellow-500' : 'text-theme-secondary'
								}`}
							>
								{remainingChars}
							</span>
						)}
					</div>
					<input
						id="forwardMessage"
						className={`bg-theme-input outline-none w-full p-[10px] text-base rounded-lg resize-none ${
							isMessageTooLong ? 'border-2 border-red-500' : 'border-theme-primary'
						}`}
						placeholder={t('modal.additionalMessagePlaceholder')}
						value={forwardMessage}
						onChange={(e) => setForwardMessage(e.target.value)}
						maxLength={2000}
					/>
					<FooterButtonsModal
						onClose={handleCloseModal}
						sentToMessage={handleForward}
						t={t}
						hasSelectedDestination={selectedObjectIdSends.length > 0}
						selectedCount={selectedObjectIdSends.length}
						isMessageTooLong={isMessageTooLong}
					/>
				</div>
			</div>
		</ModalLayout>
	);
};
export default ForwardMessageModal;

type FooterButtonsModalProps = {
	onClose: () => void;
	sentToMessage: () => Promise<void>;
	t: (key: string) => string;
	hasSelectedDestination: boolean;
	selectedCount: number;
	isMessageTooLong?: boolean;
};

const FooterButtonsModal = (props: FooterButtonsModalProps) => {
	const { onClose, sentToMessage, t, hasSelectedDestination, selectedCount, isMessageTooLong = false } = props;
	const [loading, setLoading] = useState(false);

	const displayCount = selectedCount > 99 ? '99+' : selectedCount;

	const handleSend = async () => {
		setLoading(true);
		try {
			await sentToMessage();
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex justify-end p-4 rounded-b gap-4">
			<button
				className="py-2 h-10 px-4 rounded-lg border-theme-primary hover:!underline focus:ring-transparent"
				type="button"
				onClick={onClose}
				disabled={loading}
			>
				{t('modal.cancel')}
			</button>
			<button
				onClick={handleSend}
				className="py-2 h-10 px-4 rounded text-white bg-bgSelectItem hover:!bg-bgSelectItemHover focus:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={loading || !hasSelectedDestination || isMessageTooLong}
			>
				{loading ? t('modal.sending') : `${t('modal.send')} ${selectedCount > 0 ? `(${displayCount})` : ''}`}
			</button>
		</div>
	);
};
