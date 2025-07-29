import { useEscapeKeyClose, useFriends, useMenu } from '@mezon/core';
import {
	FriendsEntity,
	channelsActions,
	friendsActions,
	requestAddFriendParam,
	selectBlockedUsers,
	selectCloseMenu,
	selectCurrentTabStatus,
	selectIsShowModalHistory,
	selectStatusMenu,
	selectTheme,
	useAppDispatch
} from '@mezon/store';
import { Button, Icons, Image, InputField } from '@mezon/ui';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ActivityList from './ActivityList';
import FriendList from './FriendsList';
const tabData = [
	{ title: 'All', value: 'all' },
	{ title: 'Online', value: 'online' },
	{ title: 'Pending', value: 'pending' },
	{ title: 'Block', value: 'block' }
];
const FriendsPage = () => {
	const dispatch = useAppDispatch();
	const { friends, quantityPendingRequest, addFriend } = useFriends();
	const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);
	const [showRequestFailedPopup, setShowRequestFailedPopup] = useState(false);
	const [openModalAddFriend, setOpenModalAddFriend] = useState(false);
	const [textSearch, setTextSearch] = useState('');
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
		setIsAlreadyFriend(false);
	};

	const resetField = () => {
		setRequestAddFriend({
			usernames: [],
			ids: []
		});
	};

	const toggleRequestFailedPopup = () => {
		setShowRequestFailedPopup(!showRequestFailedPopup);
	};

	const handleAddFriend = async () => {
		const checkIsAlreadyFriend = (username: string) => {
			return friends.some((user) => user?.user?.username === username);
		};
		if (requestAddFriend?.usernames?.length && checkIsAlreadyFriend(requestAddFriend.usernames[0])) {
			setIsAlreadyFriend(true);
			setShowRequestFailedPopup(true);
			return;
		}
		await addFriend(requestAddFriend);
		resetField();
	};

	const filterStatus = (listFriends: FriendsEntity[]) => {
		switch (currentTabStatus) {
			case 'online':
				return listFriends.filter((item) => item.state === 0 && item.user?.online);
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

	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);

	const closeMenuMobile = closeMenu && !statusMenu;

	const appearanceTheme = useSelector(selectTheme);
	const addFriendImg = useMemo(() => {
		if (appearanceTheme === 'light') {
			return 'add-fr-img-light.svg';
		}
		return 'add-fr-img-dark.svg';
	}, [appearanceTheme]);
	const isShowModalHistory = useSelector(selectIsShowModalHistory);

	return (
		<div className="flex flex-col flex-1 shrink min-w-0  h-[100%]">
			<div className={`${!isShowModalHistory ? 'draggable-area' : ''
				} flex min-w-0 items-center bg-theme-chat  px-6 py-3 justify-start h-heightHeader border-b-theme-primary`}>
				{closeMenuMobile && (
					<div className="text-theme-primary" onClick={() => setStatusMenu(true)}>
						<Icons.OpenMenu defaultSize="w-6 h-6" />
					</div>
				)}
				<div className={`gap-3 flex overflow-x-scroll hide-scrollbar ${closeMenuMobile ? 'ml-7' : ''}`}>
					<div className="flex flex-row gap-2 items-center text-theme-primary-active font-medium">
						<Icons.IconFriends />
						Friend
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
								>
									{tab.title}
								</button>
								{tab.value === 'pending' && quantityPendingRequest !== 0 && (
									<div className="absolute grid place-items-center w-[20px] h-[20px] rounded-full bg-colorDanger text-[10px] font-medium top-[2px] right-3">
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
						Add Friend
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
										onChange={(e) => setTextSearch(e.target.value)}
										placeholder="Search"
										className="mb-6 py-[10px] rounded-lg border-theme-primary bg-theme-input-primary text-[16px] font-normal h-[44px] "
									/>
									<div className="absolute top-3 right-5 text-theme-primary">
										<Icons.Search />
									</div>
								</div>
								<span className="text-[14px]  mb-4 font-bold px-[14px]">
									{currentTabStatus.toUpperCase()} - {listFriendFilter.length}
								</span>
							</div>
							<div className="px-8 overflow-hidden flex flex-1 pb-4">
								<FriendList listFriendFilter={listFriendFilter} />
							</div>
						</>
					)}
					{openModalAddFriend && (
						<div className="p-8">
							<div className="w-full flex flex-col gap-3 border-b-theme-primary">
								<span className="font-[700] text-theme-primary-active">ADD FRIEND</span>
								<span className="font-[400] text-theme-primary text-[14px]">You can add friends with their Mezon usernames</span>
								<div className="relative">
									<InputField
										onChange={(e) => handleChange('username', e.target.value)}
										type="text"
										className={` mb-2 bg-input-secondary rounded-lg mt-1 py-3 ${isAlreadyFriend ? 'border border-red-600 outline-none' : 'focus:outline focus:outline-1 dark:outline-[#00a8fc] outline-[#006ce7]'}`}
										value={requestAddFriend.usernames}
										placeholder="You can add friends with their Mezon usernames"
										needOutline={true}
									/>
									{isAlreadyFriend && (
										<div className="text-red-500 dark:text-red-400 text-[14px] pb-5">You're already friends with that user!</div>
									)}
									<Button
										className="absolute btn-primary btn-primary-hover  rounded-lg px-2 top-3 right-2 text-[14px] py-[5px]"
										disabled={!requestAddFriend.usernames?.length}
										onClick={handleAddFriend}
									>
										Send Friend Request
									</Button>
								</div>
							</div>
							<div className="flex flex-col items-center gap-7">
								<Image src={`assets/images/${addFriendImg}`} width={48} height={48} className="object-cover w-[376px]" />
								<div className="bg-theme-input text-theme-primary">Komuu is waiting on friends. You don't have to, though!</div>
							</div>
						</div>
					)}
				</div>
				<div className="contain-strict w-[416px] max-w-2/5  lg:flex hidden bg-active-friend-list">
					<ActivityList listFriend={friends} />
				</div>
			</div>
			{showRequestFailedPopup && <RequestFailedPopup togglePopup={toggleRequestFailedPopup} />}
		</div>
	);
};

const RequestFailedPopup = ({ togglePopup }: { togglePopup: () => void }) => {
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, togglePopup);
	return (
		<div ref={modalRef} tabIndex={-1} className="fixed inset-0 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
			<div onClick={togglePopup} className="fixed inset-0 bg-black opacity-50" />
			<div className="relative z-10 w-[440px] text-center">
				<div className="bg-theme-setting-primary dark:text-[#dbdee1] text-textLightTheme px-4 py-5 flex flex-col gap-5 items-center rounded-t-md">
					<div className="text-textLightTheme dark:text-textDarkTheme uppercase font-semibold text-[20px]">Friend request failed</div>
					<div>You're already friends with that user!</div>
				</div>
				<div className="p-4 bg-theme-setting-nav rounded-b-md">
					<div
						onClick={togglePopup}
						className="w-full cursor-pointer bg-[#5865f2] hover:bg-[#4752c4] text-whit rounded-sm h-[44px] flex items-center font-semibold justify-center"
					>
						Okay
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(FriendsPage);
