import { useAuth, useSendForwardMessage } from '@mezon/core';
import {
	DirectEntity,
	MessagesEntity,
	channelsActions,
	getIsFowardAll,
	getSelectedMessage,
	getStore,
	selectAllChannelMembers,
	selectAllChannelsByUser,
	selectAllDirectMessages,
	selectAllUserClans,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectDmGroupCurrentId,
	selectLoadingStatus,
	selectModeResponsive,
	selectTheme,
	toggleIsShowPopupForwardFalse,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	ChannelThreads,
	FOR_1_HOUR,
	ModeResponsive,
	TypeSearch,
	UsersClanEntity,
	addAttributesSearchList,
	getAvatarForPrioritize,
	normalizeString,
	removeDuplicatesById
} from '@mezon/utils';
import { Button, Label, Modal } from 'flowbite-react';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MessageContent from '../MessageWithUser/MessageContent';
import ListSearchForwardMessage from './ListSearchForwardMessage';

type ModalParam = {
	openModal: boolean;
};
type ObjectSend = {
	id: string;
	type: number;
	clanId?: string;
	channelLabel?: string;
	isPublic: boolean;
};
const ForwardMessageModal = ({ openModal }: ModalParam) => {
	const appearanceTheme = useSelector(selectTheme);
	const dispatch = useAppDispatch();
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const listChannels = useSelector(selectAllChannelsByUser);
	const isLoading = useSelector(selectLoadingStatus);
	const listGroup = dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_GROUP);
	const listDM = dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM);
	const { sendForwardMessage } = useSendForwardMessage();
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
	const currentChannel = useSelector(selectCurrentChannel);

	useEffect(() => {
		if (isLoading === 'loaded') {
			dispatch(channelsActions.openCreateNewModalChannel({ isOpen: false, clanId: currentChannel?.clan_id as string }));
		}
	}, [dispatch, isLoading]);

	const handleCloseModal = () => {
		dispatch(toggleIsShowPopupForwardFalse());
	};
	const handleToggle = (id: string, type: number, isPublic: boolean, clanId?: string, channelLabel?: string) => {
		const existingIndex = selectedObjectIdSends.findIndex((item) => item.id === id && item.type === type);
		if (existingIndex !== -1) {
			setSelectedObjectIdSends((prevItems) => [...prevItems.slice(0, existingIndex), ...prevItems.slice(existingIndex + 1)]);
		} else {
			setSelectedObjectIdSends((prevItems) => [...prevItems, { id, type, clanId, channelLabel, isPublic }]);
		}
	};

	const handleForward = () => {
		return isForwardAll ? handleForwardAllMessage() : sentToMessage();
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
				FOR_1_HOUR &&
			allMessagesEntities?.[allMessageIds[index]]?.sender_id === selectedMessage?.user?.id
		) {
			combineMessages.push(allMessagesEntities?.[allMessageIds[index]]);
			index++;
		}

		for (const selectedObjectIdSend of selectedObjectIdSends) {
			if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_DM) {
				for (const message of combineMessages) {
					await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_DM, false, {
						...message,
						references: []
					});
				}
			} else if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_GROUP) {
				for (const message of combineMessages) {
					await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_GROUP, false, {
						...message,
						references: []
					});
				}
			} else if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_CHANNEL) {
				for (const message of combineMessages) {
					await sendForwardMessage(
						selectedObjectIdSend.clanId || '',
						selectedObjectIdSend.id,
						ChannelStreamMode.STREAM_MODE_CHANNEL,
						currentChannel ? !currentChannel.channel_private : false,
						{ ...message, references: [] }
					);
				}
			} else if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_THREAD) {
				for (const message of combineMessages) {
					await sendForwardMessage(
						selectedObjectIdSend.clanId || '',
						selectedObjectIdSend.id,
						ChannelStreamMode.STREAM_MODE_THREAD,
						currentChannel ? !currentChannel.channel_private : false,
						{ ...message, references: [] }
					);
				}
			}
		}

		dispatch(toggleIsShowPopupForwardFalse());
	};

	const sentToMessage = async () => {
		for (const selectedObjectIdSend of selectedObjectIdSends) {
			if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_DM) {
				await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_DM, false, {
					...selectedMessage,
					references: []
				});
			} else if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_GROUP) {
				await sendForwardMessage('', selectedObjectIdSend.id, ChannelStreamMode.STREAM_MODE_GROUP, false, {
					...selectedMessage,
					references: []
				});
			} else if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_CHANNEL) {
				await sendForwardMessage(
					selectedObjectIdSend.clanId || '',
					selectedObjectIdSend.id,
					ChannelStreamMode.STREAM_MODE_CHANNEL,
					selectedObjectIdSend.isPublic,
					{ ...selectedMessage, references: [] }
				);
			} else if (selectedObjectIdSend.type === ChannelType.CHANNEL_TYPE_THREAD) {
				await sendForwardMessage(
					selectedObjectIdSend.clanId || '',
					selectedObjectIdSend.id,
					ChannelStreamMode.STREAM_MODE_THREAD,
					selectedObjectIdSend.isPublic,
					{ ...selectedMessage, references: [] }
				);
			}
		}
		dispatch(toggleIsShowPopupForwardFalse());
	};

	const usersClan = useSelector(selectAllUserClans);
	const listMemSearch = useMemo(() => {
		const listDMSearch = listDM.length
			? listDM.map((itemDM: DirectEntity) => {
					return {
						id: itemDM?.user_id?.[0] ?? '',
						name: itemDM?.usernames?.toString() ?? '',
						avatarUser: itemDM?.channel_avatar?.[0] ?? '',
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
						avatarUser: 'assets/images/avatar-group.png',
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

		const usersClanMap = new Map(listUserClanSearch.map((user) => [user.id, user]));
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
			...listGroupSearch
		];
		return removeDuplicatesById(listSearch.filter((item) => item.id !== accountId));
	}, [accountId, listDM, listGroup, membersInClan, usersClan]);

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
		<Modal className="bg-bgModalDark" theme={{ content: { base: 'w-[550px]' } }} show={openModal} dismissible={true} onClose={handleCloseModal}>
			<div className="dark:bg-bgSecondary bg-bgLightMode pt-4 rounded">
				<div>
					<h1 className="dark:text-white text-textLightTheme text-xl font-semibold text-center">Forward Message</h1>
				</div>
				<div className="px-4 pt-4">
					<input
						type="text"
						className="dark:text-[#B5BAC1] text-textLightTheme outline-none w-full h-10 p-[10px] dark:bg-bgTertiary bg-bgModifierHoverLight text-base rounded placeholder:text-sm"
						placeholder="Search"
						onChange={(e) => setSearchText(e.target.value)}
						onKeyDown={(e) => handleInputKeyDown(e)}
					/>
					<div className={`mt-4 mb-2 overflow-y-auto h-[300px] ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'thread-scroll'}`}>
						{!normalizedSearchText.startsWith('@') && !normalizedSearchText.startsWith('#') ? (
							<>
								<ListSearchForwardMessage
									listSearch={totalsSearch}
									searchText={normalizedSearchText}
									selectedObjectIdSends={selectedObjectIdSends}
									handleToggle={handleToggle}
								/>
								{isNoResult && (
									<span className=" flex flex-row justify-center dark:text-white text-colorTextLightMode">
										Can't seem to find what you're looking for?
									</span>
								)}
							</>
						) : (
							<>
								{normalizedSearchText.startsWith('@') && (
									<>
										<span className="dark:text-textPrimary text-colorTextLightMode text-left opacity-60 text-[11px] pb-1 uppercase">
											Search friend and users
										</span>
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
										<span className="dark:text-textPrimary text-colorTextLightMode text-left opacity-60 text-[11px] pb-1 uppercase">
											Searching channel
										</span>
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
						<Label htmlFor="clearAfter" value="Shared content" className="dark:text-[#B5BAC1] text-xs uppercase font-semibold" />
					</div>
					<div
						className={`h-20 overflow-y-auto dark:bg-bgProfileBody bg-bgLightModeThird p-[5px] rounded ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'thread-scroll'}`}
					>
						<MessageContent message={selectedMessage} />
					</div>
					<FooterButtonsModal onClose={handleCloseModal} sentToMessage={handleForward} />
				</div>
			</div>
		</Modal>
	);
};
export default ForwardMessageModal;

type FooterButtonsModalProps = {
	onClose: () => void;
	sentToMessage: () => Promise<void>;
};

const FooterButtonsModal = (props: FooterButtonsModalProps) => {
	const { onClose, sentToMessage } = props;
	return (
		<div className="flex justify-end p-4 rounded-b gap-4">
			<Button
				className="h-10 px-4 rounded dark:bg-slate-500 bg-slate-500 hover:!underline focus:ring-transparent"
				type="button"
				onClick={onClose}
			>
				Cancel
			</Button>
			<Button
				onClick={sentToMessage}
				className="h-10 px-4 rounded dark:bg-bgSelectItem bg-bgSelectItem hover:!bg-bgSelectItemHover focus:ring-transparent"
			>
				Send
			</Button>
		</div>
	);
};
