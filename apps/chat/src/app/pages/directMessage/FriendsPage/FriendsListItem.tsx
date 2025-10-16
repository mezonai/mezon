import { BaseProfile } from '@mezon/components';
import { useAppNavigation, useDirect, useFriends, useMemberStatus } from '@mezon/core';
import type { FriendsEntity } from '@mezon/store';
import { audioCallActions, selectCurrentTabStatus } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ETabUserStatus, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

type FriendProps = {
	friend: FriendsEntity;
};

interface Coords {
	mouseX: number;
	mouseY: number;
	distanceToBottom: number;
}

type FriendMenuProps = {
	friend: FriendsEntity;
	coords: Coords;
	onClose: () => void;
	onDeleteFriend: (username: string, id: string) => void;
	onBlockFriend: (username: string, id: string) => void;
	handleCreateDm: () => Promise<string | undefined>;
};

const FriendMenu = ({ friend, coords, onClose, onDeleteFriend, onBlockFriend, handleCreateDm }: FriendMenuProps) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const { t } = useTranslation('friendsPage');
	const dispatch = useDispatch();
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	const menuStyle = {
		position: 'fixed' as const,
		top: coords.distanceToBottom < 200 ? coords.mouseY - 200 : coords.mouseY,
		left: coords.mouseX,
		boxShadow: 'rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px'
	};

	const { toDmGroupPageFromFriendPage, navigate } = useAppNavigation();

	const handleCallFriend = useCallback(
		async (hasVideo: boolean) => {
			const response = await handleCreateDm();
			if (!response) return;
			dispatch(
				audioCallActions.setOpenVoiceCall({
					hasVideo,
					channelId: response,
					userId: friend?.user?.id
				})
			);
			const directChat = toDmGroupPageFromFriendPage(response, ChannelType.CHANNEL_TYPE_DM);
			navigate(directChat);
		},
		[friend]
	);

	return (
		<div ref={menuRef} className="bg-theme-contexify p-2 w-[150px] text-[14px] font-medium absolute z-50" style={menuStyle}>
			<div className="flex flex-col gap-1">
				<button className="text-theme-primary bg-item-hover p-2 rounded-[5px] w-full flex" onClick={() => handleCallFriend(true)}>
					{t('friendMenu.startVideoCall')}
				</button>
				<button className="text-theme-primary bg-item-hover p-2 rounded-[5px] w-full flex" onClick={() => handleCallFriend(false)}>
					{t('friendMenu.startVoiceCall')}
				</button>
				<button
					className="hover:bg-[#f67e882a] p-2 rounded-[5px] w-full text-colorDanger flex"
					onClick={() => {
						onDeleteFriend(friend?.user?.username as string, friend?.user?.id as string);
						onClose();
					}}
				>
					{t('friendMenu.removeFriend')}
				</button>
				<button
					className="hover:bg-[#f67e882a] p-2 rounded-[5px] w-full text-colorDanger flex"
					onClick={() => {
						onBlockFriend(friend?.user?.username as string, friend?.user?.id as string);
						onClose();
					}}
				>
					{t('friendMenu.block')}
				</button>
			</div>
		</div>
	);
};

const FriendsListItem = ({ friend }: FriendProps) => {
	const { t } = useTranslation('friendsPage');
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromFriendPage, navigate } = useAppNavigation();
	const { acceptFriend, deleteFriend, blockFriend, unBlockFriend } = useFriends();
	const currentTabStatus = useSelector(selectCurrentTabStatus);
	const userStatus = useMemberStatus(friend?.user?.id || '');

	const coords = useRef<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const directMessageWithUser = useCallback(async () => {
		if (currentTabStatus === ETabUserStatus.PENDING) return;
		const userID = friend?.user?.id ?? '';
		const name = friend?.user?.display_name || friend.user?.username;
		const avatar = friend.user?.avatar_url;

		const response = await createDirectMessageWithUser(userID, name, friend.user?.username, avatar);
		if (response.channel_id) {
			return response.channel_id;
		}
		return;
	}, [friend]);

	const handleAcceptFriend = (username: string, id: string) => {
		acceptFriend(username, id);
	};

	const handleDeleteFriend = (username: string, id: string) => {
		deleteFriend(username, id);
	};

	const handleBlockFriend = async (username: string, id: string) => {
		try {
			const isBlocked = await blockFriend(username, id);
			if (isBlocked) {
				toast.success(t('toast.userBlockedSuccess'));
			}
		} catch (error) {
			toast.error(t('toast.userBlockedFailed'));
		}
	};

	const handleUnblockFriend = async (username: string, id: string) => {
		try {
			const isUnblocked = await unBlockFriend(username, id);
			if (isUnblocked) {
				toast.success(t('toast.userUnblockedSuccess'));
			}
		} catch (error) {
			toast.error(t('toast.userUnblockedFailed'));
		}
	};

	const handleMenuClick = (event: React.MouseEvent) => {
		const widthMenu = 150;
		event.stopPropagation();
		const mouseX = event.clientX - widthMenu;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;
		const distanceToBottom = windowHeight - event.clientY;
		coords.current = { mouseX, mouseY, distanceToBottom };
		openFriendMenu();
	};

	const [openFriendMenu, closeFriendMenu] = useModal(
		() => (
			<FriendMenu
				friend={friend}
				coords={coords.current}
				onClose={closeFriendMenu}
				onDeleteFriend={handleDeleteFriend}
				onBlockFriend={handleBlockFriend}
				handleCreateDm={directMessageWithUser}
			/>
		),
		[friend]
	);

	const handleNavigateDM = async () => {
		const response = await directMessageWithUser();
		if (!response) return;
		const directChat = toDmGroupPageFromFriendPage(response, ChannelType.CHANNEL_TYPE_DM);
		navigate(directChat);
	};

	return (
		<div
			className="border-t-theme-primary group/list_friends text-theme-primary flex items-center h-full"
			data-e2e={generateE2eId(`chat.direct_message.friend_list.all_friend`)}
		>
			<div
				key={friend?.user?.id}
				onClick={handleNavigateDM}
				className="py-2 flex justify-between group flex-1 items-center px-3 cursor-pointer rounded-lg bg-item-hover min-w-0"
			>
				<div key={friend?.user?.id} className="flex-1 min-w-0 pr-2">
					<BaseProfile
						avatar={friend?.user?.avatar_url ?? ''}
						name={(friend?.user?.display_name || friend?.user?.username) ?? ''}
						displayName={
							<>
								{friend?.user?.display_name || friend?.user?.username}{' '}
								<span className="group-hover:inline-block hidden text-theme-primary-hover">{friend?.user?.username}</span>
							</>
						}
						status={userStatus?.status}
						userStatus={userStatus?.user_status}
					/>
				</div>
				<div className="flex-shrink-0 w-auto min-w-fit" onClick={(e) => e.stopPropagation()}>
					{friend?.state === 0 && (
						<div className="flex gap-3 items-center">
							<button onClick={handleNavigateDM} className=" bg-button-secondary rounded-full p-2 text-theme-primary-hover">
								<Icons.IconChat />
							</button>
							<button title="More" onClick={handleMenuClick} className="bg-button-secondary rounded-full p-2 text-theme-primary-hover">
								<Icons.IconEditThreeDot />
							</button>
						</div>
					)}
					{friend?.state === 1 && (
						<div className="flex gap-3 items-center">
							<button
								title="Cancel"
								className="  bg-button-secondary  rounded-full w-8 h-8 flex items-center justify-center"
								onClick={() => handleDeleteFriend(friend?.user?.username as string, friend?.user?.id as string)}
							>
								✕
							</button>
						</div>
					)}
					{friend?.state === 2 && (
						<div className="flex gap-3 items-center">
							<button
								title="Accept"
								className=" bg-button-secondary  text-theme-primary rounded-full w-8 h-8 flex items-center justify-center"
								onClick={() => handleAcceptFriend(friend?.user?.username as string, friend?.user?.id as string)}
							>
								✓
							</button>
							<button
								title="Reject"
								className=" bg-button-secondary  text-theme-primary rounded-full w-8 h-8 flex items-center justify-center"
								onClick={() => handleDeleteFriend(friend?.user?.username as string, friend?.user?.id as string)}
							>
								✕
							</button>
						</div>
					)}
					{friend?.state === 3 && (
						<div className="flex gap-3 items-center">
							<button
								className="bg-bgTertiary text-contentSecondary rounded-[6px] text-[14px] p-2 flex items-center justify-center hover:bg-bgPrimary"
								onClick={() => handleUnblockFriend(friend?.user?.username as string, friend?.user?.id as string)}
							>
								{t('friendMenu.unblock')}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FriendsListItem;
