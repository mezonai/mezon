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
import type { ChannelThreads, UsersClanEntity } from '@mezon/utils';
import {
	FOR_1_HOUR_SEC,
	ModeResponsive,
	TypeSearch,
	addAttributesSearchList,
	getAvatarForPrioritize,
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
	isFriend?: boolean; // Flag to identify friends without existing DM
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

	const handleDirectMessageForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
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

			for (const message of combineMessages) {
				await sendForwardMessage('', response.channel_id, ChannelStreamMode.STREAM_MODE_DM, false, {
					...message,
					references: []
				});
			}
			return;
		}

		for (const message of combineMessages) {
			await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_DM, false, {
				...message,
				references: []
			});
		}
	};

	const handleGroupForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		for (const message of combineMessages) {
			await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_GROUP, false, {
				...message,
				references: []
			});
		}
	};

	const handleChannelForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		for (const message of combineMessages) {
			await sendForwardMessage(
				selectedObjectIdSend.clanId || '',
				selectedObjectIdSend.id,
				ChannelStreamMode.STREAM_MODE_CHANNEL,
				currentChannel ? !currentChannel.channel_private : false,
				{ ...message, references: [] }
			);
		}
	};

	const handleThreadForwardAll = async (selectedObjectIdSend: ObjectSend, combineMessages: MessagesEntity[]) => {
		for (const message of combineMessages) {
			await sendForwardMessage(
				selectedObjectIdSend.clanId || '',
				selectedObjectIdSend.id,
				ChannelStreamMode.STREAM_MODE_THREAD,
				currentChannel ? !currentChannel.channel_private : false,
				{ ...message, references: [] }
			);
		}
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

			await sendForwardMessage('', response.channel_id, ChannelStreamMode.STREAM_MODE_DM, false, {
				...selectedMessage,
				references: []
			});
			return;
		}

		await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_DM, false, {
			...selectedMessage,
			references: []
		});
	};

	const handleGroupForward = async (selectedObjectIdSend: ObjectSend) => {
		await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_GROUP, false, {
			...selectedMessage,
			references: []
		});
	};

	const handleChannelForward = async (selectedObjectIdSend: ObjectSend) => {
		await sendForwardMessage(
			selectedObjectIdSend.clanId || '',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_CHANNEL,
			selectedObjectIdSend.isPublic,
			{ ...selectedMessage, references: [] }
		);
	};

	const handleThreadForward = async (selectedObjectIdSend: ObjectSend) => {
		await sendForwardMessage(
			selectedObjectIdSend.clanId || '',
			selectedObjectIdSend.id,
			ChannelStreamMode.STREAM_MODE_THREAD,
			selectedObjectIdSend.isPublic,
			{ ...selectedMessage, references: [] }
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
					<div className="mb-2 block">
						<label htmlFor="clearAfter" className="text-xs uppercase font-semibold text-theme-primary">
							{t('modal.sharedContent')}
						</label>
					</div>
					<div className={`h-20 overflow-y-auto  p-[5px] thread-scroll rounded-lg border-theme-primary bg-item-theme`}>
						<MessageContent message={selectedMessage} />
					</div>
					<FooterButtonsModal onClose={handleCloseModal} sentToMessage={handleForward} t={t} />
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
};

const FooterButtonsModal = (props: FooterButtonsModalProps) => {
	const { onClose, sentToMessage, t } = props;
	const [loading, setLoading] = useState(false);

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
				className="py-2 h-10 px-4 rounded text-white bg-bgSelectItem hover:!bg-bgSelectItemHover focus:ring-transparent"
				disabled={loading}
			>
				{loading ? t('modal.sending') : t('modal.send')}
			</button>
		</div>
	);
};
