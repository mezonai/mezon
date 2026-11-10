import { useAppNavigation, useAuth, useDirect, useFriends } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import {
	EStateFriend,
	audioCallActions,
	giveCoffeeActions,
	selectCurrentUserId,
	selectInfoSendToken,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { generateE2eId, type IUser } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import type { OpenModalProps } from '..';
import { useRemoveFriendModal } from '../../../hooks/useRemoveFriendModal';
import ShareContactModal from '../../ShareContact';
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
	const { t } = useTranslation('common');
	const transferDetail = useSelector(selectInfoSendToken);
	const { addFriend, acceptFriend, deleteFriend } = useFriends();
	const { openRemoveFriendModal } = useRemoveFriendModal((username, userId) => deleteFriend(username, userId));
	const currentUserId = useAppSelector(selectCurrentUserId);
	const dispatch = useAppDispatch();
	const isMe = user?.user?.id === currentUserId;
	const { userProfile } = useAuth();
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();

	const handleDefault = (event: any) => {
		event.stopPropagation();
	};

	const buttonFriendProps = useMemo(() => {
		switch (checkAddFriend) {
			case EStateFriend.BLOCK:
				return null;
			case EStateFriend.FRIEND:
				return [
					{
						title: t('friend'),
						icon: <MezonIcon icon={MzIcons16.mzUserCheck} className="text-[rgba(84,157,91,1)]" />
					}
				];
			case EStateFriend.OTHER_PENDING:
				return [
					{
						title: t('pending'),
						icon: <MezonIcon icon={MzIcons16.mzUserPending} />
					}
				];
			case EStateFriend.MY_PENDING:
				return [
					{
						title: t('accept'),
						icon: <MezonIcon icon={MzIcons16.mzCheck} className="text-[#8A93E6]" />
					},
					{
						title: t('ignore'),
						icon: <MezonIcon icon={MzIcons16.mzClose} className="text-[white]" />
					}
				];
			default:
				return [
					{
						title: t('addFriend'),
						icon: <MezonIcon icon={MzIcons16.mzUserPlus} className="text-[var(--mz-icon)]" />
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
					openRemoveFriendModal({ username: user.user?.username, id: user.user?.id, displayName: user.user?.display_name });
				}
				break;
			default: {
				handleDefault(e);
				if (user) {
					if (user.user?.id) {
						addFriend({
							ids: user.user.id,
							usernames: user.user.username,
							displayName: user.user.display_name,
							avatar: user.user.avatar_url
						});
					} else {
						if (kichUser) {
							addFriend({
								ids: kichUser.id,
								usernames: kichUser.username
							});
						}
					}
				}
			}
		}
	};
	const handleOpenTransferModal = () => {
		const note = t('transferFunds');
		dispatch(
			giveCoffeeActions.setInfoSendToken({
				sender_id: userProfile?.user?.id,
				sender_name: userProfile?.user?.username,
				receiver_id: user?.id,
				amount: 0,
				note,
				extra_attribute: transferDetail?.extra_attribute ?? '',
				receiver_name: user ? (user.name ? user.name : user.user?.username) : ''
			})
		);
		dispatch(giveCoffeeActions.setShowModalSendToken(true));
	};

	const [showShareContactModal, hideShareContactModal] = useModal(() => {
		if (!user) return null;
		return <ShareContactModal contactUser={user} onClose={hideShareContactModal} />;
	}, [user]);

	const handleOpenShareContactModal = (e: React.MouseEvent) => {
		handleDefault(e);
		showShareContactModal();
	};

	const handleCall = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			const userId = user?.user?.id;
			if (!userId) return;
			try {
				const response = await createDirectMessageWithUser(
					userId,
					user.user?.display_name || user.user?.username,
					user.user?.username,
					user.user?.avatar_url
				);
				if (response?.channel_id) {
					dispatch(
						audioCallActions.setOpenVoiceCall({
							hasVideo: false,
							channelId: response.channel_id,
							userId
						})
					);
					const directChat = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
					navigate(directChat);
				}
			} catch {
				return;
			}
		},
		[user, createDirectMessageWithUser, dispatch, toDmGroupPageFromMainApp, navigate]
	);

	if (isMe || !user) return null;
	return (
		<>
			<div
				className="mz-hover p-2 rounded-full bg-buttonMore hover:bg-buttonMoreHover relative h-fit cursor-pointer"
				onClick={(e) => {
					handleDefault(e);
					handleOpenTransferModal();
				}}
			>
				<span title={t('transfer')}>
					<MezonIcon icon={MzIcons16.mzSendMoney} className="iconWhiteImportant" />
				</span>
			</div>
			{checkAddFriend !== EStateFriend.BLOCK && !!user.user?.id && (
				<div
					className="p-2 rounded-full bg-buttonMore hover:bg-buttonMoreHover relative h-fit cursor-pointer"
					onClick={handleCall}
					data-e2e={generateE2eId('short_profile.action.button.call')}
				>
					<span title={t('call.title')}>
						<MezonIcon icon={MzIcons16.mzCall} className="iconWhiteImportant" />
					</span>
				</div>
			)}
			{checkAddFriend === EStateFriend.FRIEND && (
				<div
					className="mz-hover p-2 rounded-full bg-buttonMore hover:bg-buttonMoreHover relative h-fit cursor-pointer"
					onClick={handleOpenShareContactModal}
					data-e2e={generateE2eId('short_profile.action.button.share_contact')}
				>
					<span title={t('shareContact')}>
						<MezonIcon icon={MzIcons16.mzContact} className="iconWhiteImportant" />
					</span>
				</div>
			)}
			{buttonFriendProps?.map((button, index) => (
				<div
					className={`mz-hover p-2 rounded-full bg-buttonMore hover:bg-buttonMoreHover relative h-fit cursor-pointer  ${checkAddFriend === EStateFriend.MY_PENDING || checkAddFriend === EStateFriend.OTHER_PENDING ? `p-2 rounded-full bg-[#4e5058] relative h-fit` : ''}`}
					onClick={(e) => handleOnClickButtonFriend(e, index)}
					key={button.title}
					data-e2e={generateE2eId('short_profile.action.button.remove_friend')}
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
