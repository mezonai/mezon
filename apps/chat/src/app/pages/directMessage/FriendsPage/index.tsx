import { useEscapeKey, useFriends, useMenu } from '@mezon/core';
import {
	FriendsEntity,
	channelsActions,
	friendsActions,
	requestAddFriendParam,
	selectCloseMenu,
	selectCurrentTabStatus,
	selectStatusMenu,
	selectTheme,
	useAppDispatch
} from '@mezon/store';
import { Button, Icons, Image, InputField } from '@mezon/ui';
import { isMacDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { memo, useEffect, useMemo, useState } from 'react';
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
			return friends.some((user) => user.user?.username === username);
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
				return listFriends.filter((item) => item.state === 3);
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

	return (
		<div className="flex flex-col flex-1 shrink min-w-0 dark:bg-bgPrimary bg-[#F0F0F0] h-[100%]">
			<div
				className={`${isMacDesktop ? 'draggable-area' : ''} flex min-w-0 items-center dark:bg-bgPrimary bg-[#F0F0F0] shadow border-b-[1px] dark:border-bgTertiary border-white px-6 py-3 justify-start h-heightHeader`}
			>
				{closeMenuMobile && (
					<div onClick={() => setStatusMenu(true)}>
						<Icons.OpenMenu defaultSize="w-6 h-6" />
					</div>
				)}
				<div className={`gap-7 flex overflow-x-scroll hide-scrollbar ${closeMenuMobile ? 'ml-7' : ''}`}>
					<div className="flex flex-row gap-2 items-center dark:text-white text-black">
						<Icons.IconFriends />
						Friend
					</div>
					<div className="flex flex-row gap-4 border-l-[1px] pl-6 dark:border-bgModifierHover border-[#bbb]">
						{tabData.map((tab, index) => (
							<div key={index} className="relative">
								<button
									className={`px-3 py-[6px] rounded-[4px] dark:text-white text-black ${currentTabStatus === tab.value && !openModalAddFriend ? 'dark:bg-[#151C2B] bg-[#cfdefd]' : ''} ${tab.value === 'pending' && quantityPendingRequest !== 0 ? 'pr-[30px]' : ''}`}
									tabIndex={index}
									onClick={() => handleChangeTab(tab.value)}
								>
									{tab.title}
								</button>
								{tab.value === 'pending' && quantityPendingRequest !== 0 && (
									<div className="absolute w-[16px] h-[16px] rounded-full bg-colorDanger text-[#fff] font-bold text-[9px] flex items-center justify-center top-3 right-[5px] pt-[3px]">
										{quantityPendingRequest}
									</div>
								)}
							</div>
						))}
					</div>
					<button
						className={`px-3 py-[6px] rounded-[4px] transition-all duration-300 font-medium ${openModalAddFriend ? 'text-[#248046] dark:text-[#2dc770]' : 'text-white bg-[#248046]'} `}
						onClick={handleOpenRequestFriend}
						style={{ whiteSpace: 'nowrap' }}
					>
						Add Friend
					</button>
				</div>
			</div>
			<div className={`contain-strict flex-1 flex w-full h-full ${isElectron() ? 'pb-8' : ''}`}>
				<div className=" flex-1 dark:bg-bgPrimary bg-[#F0F0F0] flex flex-col">
					{!openModalAddFriend && (
						<>
							<div className="flex flex-col text-[#AEAEAE] px-8 pt-6">
								<div className="relative">
									<InputField
										type="text"
										onChange={(e) => setTextSearch(e.target.value)}
										placeholder="Search"
										className="mb-6 py-[10px] dark:bg-bgTertiary bg-white text-[16px] font-normal h-[44px] dark:text-textDarkTheme text-textLightTheme placeholder-textPrimary"
									/>
									<div className="absolute top-3 right-5">
										<Icons.Search />
									</div>
								</div>
								<span className="text-[14px] dark:text-contentSecondary text-black mb-4 font-bold px-[14px]">
									{currentTabStatus.toUpperCase()} - {listFriendFilter.length}
								</span>
							</div>
							<div className="pl-8 overflow-hidden flex flex-1 pb-16">
								<FriendList listFriendFilter={listFriendFilter} />
							</div>
						</>
					)}
					{openModalAddFriend && (
						<div className="p-8">
							<div className="w-full flex flex-col gap-3 border-b dark:border-[#3f4147]">
								<span className="font-[700] dark:text-white text-black">ADD FRIEND</span>
								<span className="font-[400] text-[14px] dark:text-contentTertiary text-black">
									You can add friends with their Mezon usernames
								</span>

								<div className="relative">
									<InputField
										onChange={(e) => handleChange('username', e.target.value)}
										type="text"
										className={`dark:bg-bgSurface bg-bgLightMode mb-2 mt-1 py-3 ${isAlreadyFriend ? 'border border-red-600 outline-none' : 'focus:outline focus:outline-1 dark:outline-[#00a8fc] outline-[#006ce7]'}`}
										value={requestAddFriend.usernames}
										placeholder="You can add friends with their Mezon usernames"
										needOutline={true}
									/>
									{isAlreadyFriend && (
										<div className="text-red-500 dark:text-red-400 text-[14px] pb-5">You're already friends with that user!</div>
									)}
									<Button
										label={'Send Friend Request'}
										className="absolute top-3 right-2 text-[14px] py-[5px]"
										disable={!requestAddFriend.usernames?.length}
										onClick={handleAddFriend}
										noNeedOpacity={true}
									/>
								</div>
							</div>
							<div className="flex flex-col items-center gap-7">
								<Image
									src={`assets/images/${addFriendImg}`}
									alt={'logoMezon'}
									width={48}
									height={48}
									className="object-cover w-[376px]"
								/>
								<div className="dark:text-contentTertiary text-textLightTheme">
									Komuu is waiting on friends. You don't have to, though!
								</div>
							</div>
						</div>
					)}
				</div>
				<div className="contain-strict w-[416px] max-w-2/5 dark:bg-bgTertiary bg-bgLightMode lg:flex hidden">
					<ActivityList listFriend={friends} />
				</div>
			</div>
			{showRequestFailedPopup && <RequestFailedPopup togglePopup={toggleRequestFailedPopup} />}
		</div>
	);
};

const RequestFailedPopup = ({ togglePopup }: { togglePopup: () => void }) => {
	useEscapeKey(togglePopup);
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
			<div onClick={togglePopup} className="fixed inset-0 bg-black opacity-50" />
			<div className="relative z-10 w-[440px] text-center">
				<div className="dark:bg-[#313338] bg-white dark:text-[#dbdee1] text-textLightTheme px-4 py-5 flex flex-col gap-5 items-center rounded-t-md">
					<div className="text-textLightTheme dark:text-textDarkTheme uppercase font-semibold text-[20px]">Friend request failed</div>
					<div>You're already friends with that user!</div>
				</div>
				<div className="p-4 dark:bg-[#2b2d31] bg-[#f2f3f5] rounded-b-md">
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
