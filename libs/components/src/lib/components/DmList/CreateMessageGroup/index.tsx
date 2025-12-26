import { useAppNavigation, useEscapeKeyClose, useFriends, useOnClickOutside } from '@mezon/core';
import type { DirectEntity, FriendsEntity } from '@mezon/store';
import { channelUsersActions, directActions, selectAllAccount, selectAllFriends, useAppDispatch } from '@mezon/store';
import { Icons, InputField } from '@mezon/ui';
import { GROUP_CHAT_MAXIMUM_MEMBERS, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ApiCreateChannelDescRequest } from 'mezon-js/api.gen';
import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import EmptySearchFriends from './EmptySearchFriends';

type CreateMessageGroupProps = {
	isOpen: boolean;
	onClose: () => void;
	classNames?: string;
	currentDM?: DirectEntity;
	rootRef?: RefObject<HTMLElement>;
};

const ITEM_HEIGHT = 40;

const CreateMessageGroup = ({ onClose, classNames, currentDM, rootRef }: CreateMessageGroupProps) => {
	const { t } = useTranslation('directMessage');
	const dispatch = useAppDispatch();
	const { navigate, toDmGroupPage } = useAppNavigation();
	const friends = useSelector(selectAllFriends);
	const userCurrent = useSelector(selectAllAccount);

	const [searchTerm, setSearchTerm] = useState<string>('');
	const [idActive, setIdActive] = useState<string>('');
	const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState<boolean>(false);
	const dataSelectFriends = useRef<FriendsEntity[]>([]);
	const boxRef = useRef<HTMLDivElement | null>(null);

	const { filteredFriends, numberMemberInDmGroup } = useFriends();

	const listFriends = filteredFriends(
		searchTerm.trim().toUpperCase(),
		currentDM?.type === ChannelType.CHANNEL_TYPE_GROUP || currentDM?.type === ChannelType.CHANNEL_TYPE_DM
	);

	const handleSelectFriends = (idFriend: string) => {
		setSelectedFriends((prevSelectedFriends) => {
			if (prevSelectedFriends.includes(idFriend)) {
				dataSelectFriends.current = dataSelectFriends.current?.filter((friend) => friend.id !== idFriend);
				return prevSelectedFriends.filter((friend) => friend !== idFriend);
			}
			if (currentDM?.type === ChannelType.CHANNEL_TYPE_GROUP) {
				if (
					numberMemberInDmGroup === GROUP_CHAT_MAXIMUM_MEMBERS ||
					selectedFriends.length === GROUP_CHAT_MAXIMUM_MEMBERS - (numberMemberInDmGroup ?? 0)
				) {
					return prevSelectedFriends;
				}
			} else {
				if (selectedFriends.length >= GROUP_CHAT_MAXIMUM_MEMBERS - 1) {
					return prevSelectedFriends;
				}
			}
			const dataFriend = friends.find((friend) => friend.id === idFriend);
			if (dataFriend) {
				dataSelectFriends.current?.push(dataFriend);
			}
			return [...prevSelectedFriends, idFriend];
		});
	};

	const handleCheckboxChange = (e?: React.ChangeEvent<HTMLInputElement>) => {
		const value = e?.target.value ?? '';
		handleSelectFriends(value);
	};

	const resetAndCloseModal = () => {
		setSelectedFriends([]);
		setIsCreating(false);
		onClose();
	};
	const handleAddMemberToGroupChat = async (listAdd: ApiCreateChannelDescRequest) => {
		await dispatch(
			channelUsersActions.addChannelUsers({
				channelId: currentDM?.channel_id as string,
				clanId: currentDM?.clan_id as string,
				userIds: listAdd.user_ids ?? [],
				channelType: currentDM?.type
			})
		);
		onClose();
	};

	const handleCreateDM = async () => {
		if (isCreating) return;

		setIsCreating(true);
		try {
			const listGroupDM = selectedFriends;

			const userNameGroup: string[] = [];
			const avatarGroup: string[] = [userCurrent?.user?.avatar_url || ''];
			dataSelectFriends.current?.map((friend) => {
				userNameGroup.push(friend.user?.display_name || friend.user?.username || '');
				avatarGroup.push(friend.user?.avatar_url || '');
			});
			if (currentDM?.type === ChannelType.CHANNEL_TYPE_DM) {
				listGroupDM.push(currentDM.user_ids?.at(0) as string);
				userNameGroup.push((currentDM.display_names?.at(0) || currentDM.usernames?.at(0)) as string);
				avatarGroup.push(currentDM.channel_avatar?.at(0) as string);
			}
			const bodyCreateDmGroup: ApiCreateChannelDescRequest = {
				type: selectedFriends.length > 1 ? ChannelType.CHANNEL_TYPE_GROUP : ChannelType.CHANNEL_TYPE_DM,
				channel_private: 1,
				user_ids: listGroupDM,
				clan_id: '0'
			};
			if (currentDM?.type === ChannelType.CHANNEL_TYPE_GROUP) {
				await handleAddMemberToGroupChat(bodyCreateDmGroup);
				return;
			}

			if (currentDM?.user_ids?.[0] !== userCurrent?.user?.id) {
				userNameGroup.push(userCurrent?.user?.display_name || userCurrent?.user?.username || '');
			}

			const response = await dispatch(
				directActions.createNewDirectMessage({ body: bodyCreateDmGroup, username: userNameGroup, avatar: avatarGroup })
			);
			const resPayload = response.payload as ApiCreateChannelDescRequest;
			if (resPayload.channel_id) {
				const directChat = toDmGroupPage(resPayload.channel_id, Number(resPayload.type));
				navigate(directChat);
			}
			resetAndCloseModal();
		} catch (error) {
			console.error('Error creating DM:', error);
		} finally {
			setIsCreating(false);
		}
	};

	useEffect(() => {
		if (idActive === '' && listFriends.length > 0) {
			setIdActive(listFriends[0]?.id ?? '');
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			const currentIndex = listFriends.findIndex((item) => item?.id === idActive);
			if (currentIndex === -1) return;

			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					handleArrowDown(listFriends, currentIndex);
					break;

				case 'ArrowUp':
					event.preventDefault();
					handleArrowUp(listFriends, currentIndex);
					break;

				case 'Enter':
					event.preventDefault();
					handleEnter(listFriends, idActive);
					break;

				default:
					break;
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [idActive, listFriends]);

	const handleArrowDown = (listFriends: FriendsEntity[], currentIndex: number) => {
		const nextIndex = currentIndex === listFriends.length - 1 ? 0 : currentIndex + 1;
		const newItem = listFriends[nextIndex];

		if (!boxRef.current || !newItem) return;
		const boxHeight = boxRef.current.clientHeight;
		const newItemOffset = (ITEM_HEIGHT + 4) * nextIndex;
		const newScrollTop = newItemOffset + ITEM_HEIGHT - boxHeight;
		const totalItemsHeight = listFriends.length * ITEM_HEIGHT;
		const maxScrollTop = Math.max(totalItemsHeight - boxHeight, 0);

		boxRef.current.scroll({
			top: Math.min(newScrollTop, maxScrollTop),
			behavior: 'smooth'
		});

		setIdActive(newItem.id ?? '');
	};

	const handleArrowUp = (listFriends: FriendsEntity[], currentIndex: number) => {
		const prevIndex = currentIndex === 0 ? listFriends.length - 1 : currentIndex - 1;
		const newItem = listFriends[prevIndex];

		if (!boxRef.current || !newItem) return;

		const boxHeight = boxRef.current.clientHeight;
		const newItemOffset = (ITEM_HEIGHT + 4) * prevIndex;
		const newScrollTop = newItemOffset - boxHeight + ITEM_HEIGHT;
		const totalItemsHeight = listFriends.length * ITEM_HEIGHT;
		const maxScrollTop = Math.max(totalItemsHeight - boxHeight, 0);

		boxRef.current.scroll({
			top: Math.min(Math.max(newScrollTop, 0), maxScrollTop),
			behavior: 'smooth'
		});

		setIdActive(newItem.id ?? '');
	};

	const handleEnter = (listFriends: FriendsEntity[], idActive: string) => {
		const selectedItem = listFriends.find((item) => item.id === idActive);
		if (!selectedItem) return;

		if (selectedItem.id === idActive) {
			handleSelectFriends(selectedItem.id);
		}
	};

	useEffect(() => {
		if (listFriends.length > 0) {
			setIdActive(listFriends[0].id);
		}
	}, [searchTerm]);

	const numberCanAdd = useMemo(() => {
		if (currentDM?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			if (numberMemberInDmGroup == null) return 0;
			return numberMemberInDmGroup < GROUP_CHAT_MAXIMUM_MEMBERS
				? GROUP_CHAT_MAXIMUM_MEMBERS - numberMemberInDmGroup > (listFriends?.length ?? 0)
					? (listFriends?.length ?? 0)
					: GROUP_CHAT_MAXIMUM_MEMBERS - numberMemberInDmGroup
				: 0;
		} else {
			const maxCanSelect = GROUP_CHAT_MAXIMUM_MEMBERS - 1;
			return friends.length > maxCanSelect ? maxCanSelect : friends.length;
		}
	}, [friends, currentDM?.type, listFriends?.length, numberMemberInDmGroup]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	useOnClickOutside(modalRef, onClose, rootRef);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			onMouseDown={(e) => e.stopPropagation()}
			className={`absolute top-8 right-0 z-50 outline-none bg-theme-setting-primary border-theme-primary w-[calc(100vw-2rem)] md:w-[440px] text-theme-primary rounded shadow shadow-neutral-800 ${classNames}`}
			onClick={(e) => {
				e.stopPropagation();
			}}
		>
			<div className="cursor-default text-start">
				<div className="p-4">
					<h3 className="text-lg md:text-xl text-theme-primary-active">{t('createMessageGroup.selectFriends')}</h3>
					<p className="text-sm md:text-base pt-1">{t('createMessageGroup.canAddMoreFriends', { count: numberCanAdd })}</p>
					<InputField
						type="text"
						placeholder={t('createMessageGroup.searchPlaceholder')}
						className="h-[34px] text-[14px] md:text-[16px] mt-[20px] border-theme-primary "
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						autoFocus={true}
					/>
				</div>
				{listFriends.length > 0 ? (
					<div ref={boxRef} className="w-full h-[190px] overflow-y-auto overflow-x-hidden thread-scroll">
						{listFriends.map((friend: FriendsEntity, index) => (
							<div
								key={friend.id}
								onMouseEnter={() => setIdActive(friend.id ?? '')}
								onMouseLeave={() => setIdActive(friend.id ?? '')}
								className={`${idActive === friend.id ? 'bg-item-theme ' : ''} flex items-center h-10 px-2 ml-3 mr-2 py-[8px] rounded-lg cursor-pointer`}
								data-e2e={generateE2eId(`chat.direct_message.friend_list.friend_item`)}
							>
								<label className="flex flex-row items-center justify-between w-full gap-2 py-[3px] cursor-pointer">
									<div className="flex flex-row items-center gap-2">
										<AvatarImage
											alt={''}
											username={friend.user?.username}
											srcImgProxy={createImgproxyUrl(friend.user?.avatar_url ?? '', {
												width: 100,
												height: 100,
												resizeType: 'fit'
											})}
											src={friend.user?.avatar_url}
											className="size-6 md:size-8"
											classNameText="text-[7px] md:text-[9px] min-w-4 min-h-4 md:min-w-5 md:min-h-5 pt-[3px]"
										/>
										<span
											className={`text-sm md:text-base font-medium text-theme-primary-active one-line`}
											data-e2e={generateE2eId(`chat.direct_message.friend_list.username_friend_item`)}
										>
											{friend.user?.display_name}
										</span>
										<span className="  font-medium">{friend.user?.username}</span>
									</div>
									<div className="relative flex flex-row justify-center">
										<input
											id={`checkbox-item-${index}`}
											type="checkbox"
											value={friend.id}
											checked={selectedFriends.includes(friend?.id || '')}
											onChange={handleCheckboxChange}
											className="peer appearance-none forced-colors:appearance-auto relative w-4 h-4 border-theme-primary rounded-md focus:outline-none"
										/>
										<Icons.Check className="absolute invisible peer-checked:visible forced-colors:hidden w-4 h-4" />
									</div>
								</label>
							</div>
						))}
					</div>
				) : (
					<EmptySearchFriends />
				)}

				<div className="p-[20px]">
					<button
						disabled={selectedFriends.length === 0 || isCreating}
						onClick={handleCreateDM}
						className={`h-[38px] w-full text-xs md:text-sm text-white rounded ${
							selectedFriends.length === 0 || isCreating
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-buttonPrimary hover:bg-bgSelectItemHover'
						}`}
						data-e2e={generateE2eId(`chat.direct_message.button.create_group`)}
					>
						{isCreating
							? `${t('createMessageGroup.creating')}`
							: currentDM?.type === ChannelType.CHANNEL_TYPE_GROUP
								? t('createMessageGroup.addToGroupChat')
								: selectedFriends.length === 0
									? t('createMessageGroup.createDMOrGroupChat')
									: selectedFriends.length === 1 && currentDM?.type !== ChannelType.CHANNEL_TYPE_DM
										? t('createMessageGroup.createDM')
										: t('createMessageGroup.createGroupChat')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreateMessageGroup;
