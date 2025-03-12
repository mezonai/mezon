import { MemberProfile } from '@mezon/components';
import { useAppNavigation, useDirect, useFriends } from '@mezon/core';
import { ChannelMembersEntity, FriendsEntity } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { MemberProfileType, MetaDateStatusUser } from '@mezon/utils';
import { useEffect, useMemo, useRef } from 'react';
import { useModal } from 'react-modal-hook';

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
};

const FriendMenu = ({ friend, coords, onClose, onDeleteFriend, onBlockFriend }: FriendMenuProps) => {
	const menuRef = useRef<HTMLDivElement>(null);

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

	return (
		<div
			ref={menuRef}
			className="dark:bg-[#242529] bg-bgLightMode border dark:border-borderDefault text-contentSecondary p-2 w-[150px] text-[14px] font-medium absolute z-50"
			style={menuStyle}
		>
			<div className="flex flex-col gap-1">
				<button
					className="dark:hover:bg-hoverPrimary hover:bg-bgLightModeThird dark:text-textDarkTheme text-[#6a6b72] p-2 rounded-[5px] w-full flex"
					onClick={onClose}
				>
					Start Video Call
				</button>
				<button
					className="dark:hover:bg-hoverPrimary hover:bg-bgLightModeThird dark:text-textDarkTheme text-[#6a6b72] p-2 rounded-[5px] w-full flex"
					onClick={onClose}
				>
					Start Voice Call
				</button>
				<button
					className="dark:hover:bg-colorDanger dark:hover:text-contentSecondary hover:bg-bgLightModeThird p-2 rounded-[5px] w-full text-colorDanger flex"
					onClick={() => {
						onDeleteFriend(friend?.user?.username as string, friend?.user?.id as string);
						onClose();
					}}
				>
					Remove Friend
				</button>
				<button
					className="dark:hover:bg-colorDanger dark:hover:text-contentSecondary hover:bg-bgLightModeThird p-2 rounded-[5px] w-full text-colorDanger flex"
					onClick={() => {
						onBlockFriend(friend?.user?.username as string, friend?.user?.id as string);
						onClose();
					}}
				>
					Block
				</button>
			</div>
		</div>
	);
};

const FriendsListItem = ({ friend }: FriendProps) => {
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromFriendPage, navigate } = useAppNavigation();
	const { acceptFriend, blockFriend, deleteFriend, unBlockFriend } = useFriends();

	const coords = useRef<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const directMessageWithUser = async (userId: string) => {
		const response = await createDirectMessageWithUser(userId);
		if (response.channel_id) {
			const directChat = toDmGroupPageFromFriendPage(response.channel_id, Number(response.type));
			navigate(directChat);
		}
	};

	const handleAcceptFriend = (username: string, id: string) => {
		acceptFriend(username, id);
	};

	const handleDeleteFriend = (username: string, id: string) => {
		deleteFriend(username, id);
	};

	const handleBlockFriend = (username: string, id: string) => {
		blockFriend(username, id);
	};

	const handleUnBlockFriend = (username: string, id: string) => {
		unBlockFriend(username, id);
	};

	const handleMenuClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		const mouseX = event.clientX;
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
			/>
		),
		[friend]
	);

	const userFriend = useMemo(() => {
		if (friend?.user) {
			return friend?.user as any;
		}
	}, [friend?.user]);

	return (
		<div className="border-t-[1px] dark:border-[#3f4147] border-gray-300 group/list_friends">
			<div
				key={friend?.user?.id}
				onClick={() => directMessageWithUser(friend?.user?.id ?? '')}
				className="py-3 flex justify-between items-center px-[12px] cursor-pointer dark:hover:bg-[#393c41] hover:bg-[#eaebed] rounded-lg"
			>
				<div key={friend?.user?.id} className={'flex-1'}>
					<MemberProfile
						avatar={friend?.user?.avatar_url ?? ''}
						name={(friend?.user?.display_name || friend?.user?.username) ?? ''}
						usernameAva={friend?.user?.username ?? ''}
						status={{ status: friend?.user?.online, isMobile: false }}
						isHideStatus={friend?.state !== 0}
						isHideIconStatus={friend?.state !== 0}
						isHideAnimation={true}
						key={friend?.user?.id}
						numberCharacterCollapse={100}
						classParent={friend?.state !== undefined && friend?.state >= 1 ? '' : 'friendList h-10'}
						positionType={MemberProfileType.LIST_FRIENDS}
						customStatus={(friend?.user?.metadata as MetaDateStatusUser).status ?? ''}
						isDM={true}
						user={friend as ChannelMembersEntity}
						statusOnline={userFriend?.metadata?.user_status}
					/>
				</div>
				<div onClick={(e) => e.stopPropagation()}>
					{friend?.state === 0 && (
						<div className="flex gap-3 items-center">
							<button
								onClick={() => directMessageWithUser(friend?.user?.id ?? '')}
								className="dark:bg-bgTertiary bg-[#E1E1E1] rounded-full p-2"
							>
								<Icons.IconChat className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
							</button>
							<button onClick={handleMenuClick} className="dark:bg-bgTertiary bg-[#E1E1E1] rounded-full p-2">
								<Icons.IconEditThreeDot className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
							</button>
						</div>
					)}
					{friend?.state === 1 && (
						<div className="flex gap-3 items-center">
							<button
								className="dark:bg-bgTertiary bg-bgLightModeButton dark:text-contentSecondary text-textLightTheme rounded-full w-8 h-8 flex items-center justify-center"
								onClick={() => handleDeleteFriend(friend?.user?.username as string, friend?.user?.id as string)}
							>
								✕
							</button>
						</div>
					)}
					{friend?.state === 2 && (
						<div className="flex gap-3 items-center">
							<button
								className="dark:bg-bgTertiary bg-bgLightModeButton dark:text-contentSecondary text-textLightTheme rounded-full w-8 h-8 flex items-center justify-center"
								onClick={() => handleAcceptFriend(friend?.user?.username as string, friend?.user?.id as string)}
							>
								✓
							</button>
							<button
								className="dark:bg-bgTertiary bg-bgLightModeButton dark:text-contentSecondary text-textLightTheme rounded-full w-8 h-8 flex items-center justify-center"
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
								onClick={() => handleUnBlockFriend(friend?.user?.username as string, friend?.user?.id as string)}
							>
								UnBlock
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FriendsListItem;
