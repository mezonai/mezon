import { useEscapeKeyClose, useFriends, useMenu } from '@mezon/core';
import type { FriendsEntity, requestAddFriendParam } from '@mezon/store';
import {
	EStateFriend,
	channelsActions,
	friendsActions,
	selectBlockedUsers,
	selectCloseMenu,
	selectCurrentTabStatus,
	selectStatusMenu,
	useAppDispatch
} from '@mezon/store';
import { Button, Icons, Image, InputField } from '@mezon/ui';
import { EUserStatus, generateE2eId } from '@mezon/utils';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ActivityList from './ActivityList';
import FriendList from './FriendsList';
const FriendsPage = () => {
	const { t } = useTranslation('friendsPage');
	const dispatch = useAppDispatch();
	const tabData = [
		{ title: t('tabs.all'), value: 'all' },
		{ title: t('tabs.online'), value: 'online' },
		{ title: t('tabs.pending'), value: 'pending' },
		{ title: t('tabs.block'), value: 'block' }
	];

	const getTranslatedTabName = (tabValue: string) => {
		const tab = tabData.find((tab) => tab.value === tabValue);
		return tab ? tab.title.toUpperCase() : tabValue.toUpperCase();
	};
	const { friends, quantityPendingRequest, addFriend, acceptFriend } = useFriends();
	const [isAlreadyFriend, setIsAlreadyFriend] = useState<boolean | null>(null);
	const [openModalAddFriend, setOpenModalAddFriend] = useState(false);
	const [textSearch, setTextSearch] = useState('');
	const [isInvalidInput, setIsInvalidInput] = useState(false);
	const currentTabStatus = useSelector(selectCurrentTabStatus);
	const blockedUsers = useSelector(selectBlockedUsers);

	const handleChangeTab = (valueTab: string) => {
		dispatch(friendsActions.changeCurrentStatusTab(valueTab));
		setOpenModalAddFriend(false);
	};

	const handleOpenRequestFriend = () => {
		setOpenModalAddFriend(true);
	};

	const [requestAddFriend, setRequestAddFriend] = useState<requestAddFriendParam>({
		usernames: [],
		ids: []
	});

	useEffect(() => {
		dispatch(channelsActions.setCurrentChannelId({ clanId: '0', channelId: '' }));
	}, []);

	const handleChange = (key: string, value: string) => {
		const isValidInput = /^[\p{L}0-9+\-_.]+$/u.test(value);

		setIsInvalidInput(!isValidInput && value !== '');

		switch (key) {
			case 'username':
				if ((value || '').trim()) {
					setRequestAddFriend({ ...requestAddFriend, usernames: [value] });
				} else {
					setRequestAddFriend({ ...requestAddFriend, usernames: [] });
				}
				break;
			case 'id':
				setRequestAddFriend({ ...requestAddFriend, ids: [value] });
				break;
			default:
				return;
		}
		setIsAlreadyFriend(null);
	};

	const resetField = () => {
		setRequestAddFriend({
			usernames: [],
			ids: []
		});
		setIsInvalidInput(false);
		setIsAlreadyFriend(null);
	};

	const handleAddFriend = async () => {
		const username = requestAddFriend?.usernames?.[0];
		if (!username) return;

		const friend = friends?.find((u) => u?.user?.username === username);

		if (friend) {
			if (friend.state === EStateFriend.MY_PENDING) {
				await acceptFriend(friend.user?.username || '', friend.user?.id || '');
			} else {
				setIsAlreadyFriend(friend.state === EStateFriend.OTHER_PENDING);
			}
			return;
		}

		const payload: requestAddFriendParam =
			requestAddFriend.ids && requestAddFriend.ids.length > 0 ? { ids: requestAddFriend.ids } : { usernames: requestAddFriend.usernames };

		await addFriend(payload);
		resetField();
	};

	const filterStatus = (listFriends: FriendsEntity[]) => {
		switch (currentTabStatus) {
			case 'online':
				return listFriends.filter((item) => item.state === 0 && item.user?.online && item.user?.status !== EUserStatus.INVISIBLE);
			case 'all':
				return listFriends.filter((item) => item.state === 0);
			case 'pending':
				return listFriends.filter((item) => item.state === 1 || item.state === 2);
			case 'block':
				return blockedUsers;
			default:
				return listFriends;
		}
	};

	const listFriendFilter = filterStatus(friends)
		.filter((obj) => {
			const normalizedUsername = (obj.user?.username || '').toLowerCase();
			const normalizedDisplayName = (obj.user?.display_name || '').toLowerCase();
			const normalizedSearchText = textSearch.toLowerCase();

			return normalizedUsername.includes(normalizedSearchText) || normalizedDisplayName.includes(normalizedSearchText);
		})
		.sort((start, next) => {
			const nameStart = (start.user?.display_name || start.user?.username) ?? '';
			const nameNext = (next.user?.display_name || next.user?.username) ?? '';
			return nameStart.localeCompare(nameNext);
		});

	const getEmptyStateMessage = (tab: string) => {
		if (textSearch.trim()) {
			switch (tab) {
				case 'all':
					return t('statusTapSearchFriends.all');
				case 'online':
					return t('statusTapSearchFriends.online');
				case 'pending':
					return t('statusTapSearchFriends.pending');
				case 'block':
					return t('statusTapSearchFriends.block');
				default:
					return t('statusTapSearchFriends.all');
			}
		}
		switch (tab) {
			case 'all':
				return t('statusTapListFriends.all');
			case 'online':
				return t('statusTapListFriends.online');
			case 'pending':
				return t('statusTapListFriends.pending');
			case 'block':
				return t('statusTapListFriends.block');
			default:
				return t('statusTapListFriends.all');
		}
	};

	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);

	const closeMenuMobile = closeMenu && !statusMenu;
	return (
		<div className="flex flex-col flex-1 shrink min-w-0  h-[100%]">
			<div className={`draggable-area flex min-w-0 items-center bg-theme-chat  px-6 py-3 justify-start h-heightHeader border-b-theme-primary`}>
				{closeMenuMobile && (
					<div className="text-theme-primary" onClick={() => setStatusMenu(true)}>
						<Icons.OpenMenu defaultSize="w-6 h-6" />
					</div>
				)}
				<div className={`gap-3 flex overflow-x-scroll hide-scrollbar ${closeMenuMobile ? 'ml-7' : ''}`}>
					<div className="flex flex-row gap-2 items-center text-theme-primary-active font-medium">
						<Icons.IconFriends />
						{t('friends')}
					</div>
					<div className="flex flex-row gap-2 items-center text-theme-primary">
						<Icons.DotIcon className="w-1 h-1" />
					</div>
					<div className="flex flex-row gap-4 pr-4">
						{tabData.map((tab, index) => (
							<div key={index} className="relative flex items-center justify-center">
								<button
									className={`px-3 py-[6px] font-medium rounded-lg text-theme-primary text-theme-primary-hover shadow-none border-none bg-button-hover ${currentTabStatus === tab.value && !openModalAddFriend ? 'bg-active-button text-theme-primary-active' : ''} ${tab.value === 'pending' && quantityPendingRequest !== 0 ? 'pr-[30px]' : ''}`}
									tabIndex={index}
									onClick={() => handleChangeTab(tab.value)}
									data-e2e={generateE2eId(`friend_page.tab`)}
								>
									{tab.title}
								</button>
								{tab.value === 'pending' && quantityPendingRequest !== 0 && (
									<div 
										className="absolute grid place-items-center w-[20px] h-[20px] rounded-full bg-colorDanger text-[10px] font-medium top-[2px] right-3"
										data-e2e={generateE2eId('badge.friend_pending')}
									>
										{quantityPendingRequest}
									</div>
								)}
							</div>
						))}
					</div>
					<Button
						onClick={handleOpenRequestFriend}
						className={`whitespace-nowrap  px-2 rounded-lg font-medium   ${openModalAddFriend ? ' cursor-not-allowed button-add-friend-active' : 'btn-primary btn-primary-hover '}`}
					>
						{t('addFriend')}
					</Button>
				</div>
			</div>
			<div className={`contain-strict flex-1 flex w-full h-full `}>
				<div className=" flex-1 flex flex-col bg-theme-chat">
					{!openModalAddFriend && (
						<>
							<div className="flex flex-col text-theme-primary px-8 pt-6">
								<div className="relative">
									<InputField
										type="text"
										value={textSearch}
										onChange={(e) => setTextSearch(e.target.value)}
										placeholder={t('search')}
										needOutline={true}
										className="mb-6 py-[10px] rounded-lg border-theme-primary bg-theme-input-primary text-[16px] font-normal h-[44px] focus:outline focus:outline-1  outline-[#006ce7] "
										data-e2e={generateE2eId('friend_page.input.search')}
									/>
									{Boolean(textSearch) && (
										<div
											className="absolute top-2.5 right-12 text-theme-primary cursor-pointer select-none text-[25px] px-2 leading-none hover:text-red-500"
											onClick={() => setTextSearch('')}
											aria-label={t('clearSearch')}
											title={t('clearSearch')}
										>
											×
										</div>
									)}
									<div className="absolute top-3 right-5 text-theme-primary">
										<Icons.Search />
									</div>
								</div>
								<span className="text-[14px]  mb-4 font-bold px-[14px]">
									{getTranslatedTabName(currentTabStatus)} - {listFriendFilter.length}
								</span>
							</div>
							<div className="px-8 overflow-hidden flex flex-1 pb-4">
								{listFriendFilter.length > 0 ? (
									<FriendList listFriendFilter={listFriendFilter} />
								) : (
									<div className="flex w-full text-theme-primary flex-col items-center justify-center h-full">
										<div className="flex w-2/3 text-center justify-center mb-[120px]">
											{getEmptyStateMessage(currentTabStatus)}
										</div>
									</div>
								)}
							</div>
						</>
					)}
					{openModalAddFriend && (
						<div className="p-8">
							<div className="w-full flex flex-col gap-3 border-b-theme-primary">
								<span className="font-[700] text-theme-primary-active">{t('addFriendModal.title')}</span>
								<span className="font-[400] text-theme-primary text-[14px]">{t('addFriendModal.description')}</span>
								<div className="relative group">
									<InputField
										onChange={(e) => handleChange('username', e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' && requestAddFriend.usernames?.length) {
												handleAddFriend();
											}
										}}
										type="text"
										className={`mb-2 bg-input-secondary rounded-lg mt-1 py-3 pr-[90px] md:pr-[140px] ${isAlreadyFriend ? 'border border-red-600 outline-none' : 'focus:outline focus:outline-1 dark:outline-[#00a8fc] outline-[#006ce7]'}`}
										value={requestAddFriend.usernames}
										placeholder={t('addFriendModal.placeholder')}
										needOutline={true}
										data-e2e={generateE2eId('friend_page.input.add_friend')}
									/>
									{isAlreadyFriend !== null && (
										<div
											className="text-red-500 dark:text-red-400 text-[14px] pb-5"
											data-e2e={generateE2eId('friend_page.input.error')}
										>
											{isAlreadyFriend ? t('addFriendModal.waitAccept') : t('addFriendModal.alreadyFriends')}
										</div>
									)}
									{isInvalidInput && (
										<div
											className="text-red-500 dark:text-red-400 text-[14px] pb-5"
											data-e2e={generateE2eId('friend_page.input.error')}
										>
											{t('addFriendModal.invalidInput')}
										</div>
									)}
									<Button
										className="absolute btn-primary btn-primary-hover rounded-lg px-2 top-3 right-2 text-[14px] py-[5px] min-w-[80px] md:min-w-[130px]"
										disabled={!requestAddFriend.usernames?.length || isInvalidInput}
										onClick={handleAddFriend}
										data-e2e={generateE2eId('friend_page.button.send_friend_request')}
									>
										<span className="hidden md:inline">{t('addFriendModal.sendRequest')}</span>
										<span className="md:hidden">{t('addFriendModal.add')}</span>
									</Button>
								</div>
							</div>
							<div className="flex flex-col items-center gap-7">
								<Image
									src={'https://cdn.mezon.ai/landing-page-mezon/addfriends.webp'}
									width={100}
									height={100}
									className="object-cover w-[646px] opacity-45"
								/>
								<div className="text-theme-primary">{t('addFriendModal.waitingMessage')}</div>
							</div>
						</div>
					)}
				</div>
				<div className="contain-strict w-[416px] max-w-2/5  lg:flex hidden bg-active-friend-list">
					<ActivityList listFriend={friends} />
				</div>
			</div>
		</div>
	);
};

const RequestFailedPopup = ({ togglePopup }: { togglePopup: () => void }) => {
	const { t } = useTranslation('friendsPage');
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, togglePopup);
	return (
		<div ref={modalRef} tabIndex={-1} className="fixed inset-0 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
			<div onClick={togglePopup} className="fixed inset-0 bg-black opacity-50" />
			<div className="relative z-10 w-[440px] text-center">
				<div className="bg-theme-setting-primary dark:text-[#dbdee1] text-textLightTheme px-4 py-5 flex flex-col gap-5 items-center rounded-t-md">
					<div className="text-textLightTheme dark:text-textDarkTheme uppercase font-semibold text-[20px]">
						{t('requestFailedPopup.title')}
					</div>
					<div>{t('requestFailedPopup.message')}</div>
				</div>
				<div className="p-4 bg-theme-setting-nav rounded-b-md">
					<div
						onClick={togglePopup}
						className="w-full cursor-pointer bg-[#5865f2] hover:bg-[#4752c4] text-whit rounded-sm h-[44px] flex items-center font-semibold justify-center"
						data-e2e={generateE2eId('friend_page.request_failed_popup.button.okay')}
					>
						{t('requestFailedPopup.okay')}
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(FriendsPage);
