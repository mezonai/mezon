import { useAuth, useFriends } from '@mezon/core';
import {
	ChannelMembersEntity,
	EStateFriend,
	giveCoffeeActions,
	selectCurrentUserId,
	selectInfoSendToken,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IUser } from '@mezon/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { OpenModalProps } from '..';
import { PopupFriend } from './PopupShortUser';

type GroupIconBannerProps = {
	checkAddFriend?: number;
	openModal: OpenModalProps;
	user: ChannelMembersEntity | null;
	showPopupLeft?: boolean;
	setOpenModal: React.Dispatch<React.SetStateAction<OpenModalProps>>;
	kichUser?: IUser | null;
};

const GroupIconBanner = (props: GroupIconBannerProps) => {
	const { checkAddFriend, openModal, user, showPopupLeft, setOpenModal, kichUser } = props;
	const transferDetail = useSelector(selectInfoSendToken);
	const { addFriend, acceptFriend, deleteFriend } = useFriends();
	const currentUserId = useAppSelector(selectCurrentUserId);
	const dispatch = useAppDispatch();
	const isMe = user?.user?.id === currentUserId;
	const { userProfile } = useAuth();

	const handleDefault = (event: any) => {
		event.stopPropagation();
	};

	const buttonFriendProps = useMemo(() => {
		switch (checkAddFriend) {
			case EStateFriend.FRIEND:
				return [
					{
						title: 'Friend',
						icon: <Icons.IconFriend className="size-4" />
					}
				];
			case EStateFriend.OTHER_PENDING:
				return [
					{
						title: 'Pending',
						icon: <Icons.PendingFriend className="size-4 " />
					}
				];
			case EStateFriend.MY_PENDING:
				return [
					{
						title: 'Accept',
						icon: <Icons.IConAcceptFriend className="size-4" />
					},
					{
						title: 'Ignore',
						icon: <Icons.IConIgnoreFriend className="size-4" />
					}
				];
			default:
				return [
					{
						title: 'Add friend',
						icon: <Icons.AddPerson className="size-4 " />
					}
				];
		}
	}, [checkAddFriend]);

	const handleOnClickButtonFriend = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
		switch (checkAddFriend) {
			case EStateFriend.FRIEND:
				handleDefault(e);
				setOpenModal({ openOption: false, openFriend: !openModal.openFriend });
				break;
			case EStateFriend.OTHER_PENDING:
				handleDefault(e);
				break;
			case EStateFriend.MY_PENDING:
				handleDefault(e);
				if (user) {
					if (index === 0) {
						acceptFriend(user.user?.username || '', user.user?.id || '');
						break;
					}
					deleteFriend(user.user?.username || '', user.user?.id || '');
				}
				break;
			default: {
				handleDefault(e);
				if (user) {
					addFriend({
						usernames: [user.user?.username || ''],
						ids: []
					});
				} else {
					if (kichUser) {
						addFriend({
							usernames: [kichUser.username],
							ids: []
						});
					}
				}
			}
		}
	};

	const handleOpenTransferModal = () => {
		const note = 'Transfer funds';
		dispatch(
			giveCoffeeActions.setInfoSendToken({
				sender_id: userProfile?.user?.id,
				sender_name: userProfile?.user?.username,
				receiver_id: user?.id,
				amount: 0,
				note: note,
				extra_attribute: transferDetail?.extra_attribute ?? '',
				receiver_name: user ? (user.name ? user.name : user.user?.username) : ''
			})
		);
		dispatch(giveCoffeeActions.setShowModalSendToken(true));
	};
	if (isMe || !user) return null;
	return (
		<>
			<div
				className="p-2 rounded-full bg-buttonMore hover:bg-buttonMoreHover relative h-fit cursor-pointer"
				onClick={(e) => {
					handleDefault(e);
					handleOpenTransferModal();
				}}
			>
				<span title="Transfer">
					<Icons.Transaction className="size-4 iconWhiteImportant" />
				</span>
			</div>
			{buttonFriendProps.map((button, index) => (
				<div
					className={`p-2 rounded-full bg-buttonMore hover:bg-buttonMoreHover relative h-fit cursor-pointer  ${checkAddFriend === EStateFriend.MY_PENDING || checkAddFriend === EStateFriend.OTHER_PENDING ? `p-2 rounded-full bg-[#4e5058] relative h-fit` : ''}`}
					onClick={(e) => handleOnClickButtonFriend(e, index)}
					key={button.title}
				>
					<span className="text-white" title={button.title}>
						{button.icon}
					</span>

					{openModal.openFriend && checkAddFriend === EStateFriend.FRIEND && <PopupFriend user={user} showPopupLeft={showPopupLeft} />}
				</div>
			))}
		</>
	);
};

export default GroupIconBanner;
