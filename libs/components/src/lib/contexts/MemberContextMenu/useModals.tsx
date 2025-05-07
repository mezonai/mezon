import { ChannelMembersEntity, clansActions, getStore, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { useCallback, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { ModalUserProfile } from '../../components';
import UserProfileModalInner from '../../components/UserProfileModalInner/index';

export interface ModalsState {
	modalState: React.MutableRefObject<{
		profileItem: boolean;
		userProfile: boolean;
	}>;
	currentUser: ChannelMembersEntity | null;
	setCurrentUser: (user: ChannelMembersEntity | null) => void;
	positionShortUser: { top: number; left: number } | null;
	setPositionShortUser: (position: { top: number; left: number } | null) => void;
	showUserProfileModal: () => void;
	hideUserProfileModal: () => void;
	showProfileItemModal: () => void;
	hideProfileItemModal: () => void;
	openModalRemoveMember: boolean;
	setOpenModalRemoveMember: (open: boolean) => void;
	handleRemoveMember: () => Promise<void>;
	closeRemoveMemberModal: () => void;
	openUserProfile: (user: ChannelMembersEntity, avatar?: string) => void;
	openProfileItem: (event: React.MouseEvent, user: ChannelMembersEntity) => void;
	openRemoveMemberModal: (user: ChannelMembersEntity) => void;
}

export const useModals = (): ModalsState => {
	const [currentUser, setCurrentUser] = useState<ChannelMembersEntity | null>(null);
	const [positionShortUser, setPositionShortUser] = useState<{ top: number; left: number } | null>(null);
	const [openModalRemoveMember, setOpenModalRemoveMember] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const modalState = useRef({
		profileItem: false,
		userProfile: false
	});

	const [showUserProfileModal, hideUserProfileModal] = useModal(() => {
		if (!currentUser) return null;

		const avatar = currentUser.clan_avatar ? currentUser.clan_avatar : (currentUser?.user?.avatar_url ?? '');
		modalState.current.userProfile = true;

		return (
			<UserProfileModalInner
				userId={currentUser?.user?.id || currentUser?.id}
				onClose={() => {
					hideUserProfileModal();
					modalState.current.userProfile = false;
				}}
				isDM={false}
				user={currentUser}
				avatar={avatar}
			/>
		);
	}, [currentUser]);

	const [showProfileItemModal, hideProfileItemModal] = useModal(() => {
		if (!currentUser || !positionShortUser) return null;
		modalState.current.profileItem = true;

		const avatar = currentUser.clan_avatar ? currentUser.clan_avatar : (currentUser?.user?.avatar_url ?? '');
		const username = currentUser?.clan_nick || currentUser?.user?.display_name || currentUser?.user?.username || '';

		return (
			<div
				className="fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9 dark:bg-black bg-gray-200 w-[300px] max-w-[89vw] rounded-lg flex flex-col duration-300 ease-in-out animate-fly_in"
				style={{
					top: `${positionShortUser?.top}px`,
					left: `${positionShortUser?.left}px`
				}}
			>
				<ModalUserProfile
					onClose={() => {
						hideProfileItemModal();
						modalState.current.profileItem = false;
					}}
					userID={currentUser?.id || ''}
					classBanner="rounded-tl-lg rounded-tr-lg h-[105px]"
					avatar={avatar}
					name={username}
					isDM={false}
					user={currentUser}
				/>
			</div>
		);
	}, [currentUser, positionShortUser]);

	const handleRemoveMember = async () => {
		if (!currentUser) return;

		const store = getStore();
		const clanId = selectCurrentClanId(store.getState()) as string;
		const userIds = [currentUser.user?.id ?? ''];

		await dispatch(clansActions.removeClanUsers({ clanId, userIds }));
		if (userIds.length <= 0) {
			await dispatch(clansActions.removeClanUsers({ clanId, userIds }));
		}

		setOpenModalRemoveMember(false);
	};

	const openUserProfile = useCallback(
		(user: ChannelMembersEntity, avatar?: string) => {
			setCurrentUser(user);
			if (modalState.current.profileItem) {
				hideProfileItemModal();
			}
			showUserProfileModal();
		},
		[showUserProfileModal, hideProfileItemModal]
	);

	const openProfileItem = useCallback(
		(event: React.MouseEvent, user: ChannelMembersEntity) => {
			event.preventDefault();

			const popupWidth = 300;
			const popupHeight = 350;
			const padding = 50;

			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			const mouseX = event.clientX;
			const mouseY = event.clientY;

			let left = mouseX + padding;
			let top = mouseY;

			if (left + popupWidth > windowWidth - padding) {
				left = mouseX - popupWidth - padding;
			}

			if (left < padding) {
				left = Math.max(padding, (windowWidth - popupWidth) / 2);
			}

			if (top + popupHeight > windowHeight - padding) {
				top = Math.max(padding, windowHeight - popupHeight - padding);
			}

			setPositionShortUser({
				top,
				left
			});

			setCurrentUser(user);
			showProfileItemModal();
		},
		[showProfileItemModal]
	);

	const openRemoveMemberModal = useCallback(
		(user: ChannelMembersEntity) => {
			setCurrentUser(user);
			setOpenModalRemoveMember(true);

			if (modalState.current.profileItem) {
				hideProfileItemModal();
			}
			if (modalState.current.userProfile) {
				hideUserProfileModal();
			}
		},
		[hideProfileItemModal, hideUserProfileModal]
	);

	const closeRemoveMemberModal = useCallback(() => {
		setOpenModalRemoveMember(false);
	}, []);

	return {
		modalState,
		currentUser,
		setCurrentUser,
		positionShortUser,
		setPositionShortUser,
		showUserProfileModal,
		hideUserProfileModal,
		showProfileItemModal,
		hideProfileItemModal,
		openModalRemoveMember,
		setOpenModalRemoveMember,
		handleRemoveMember,
		closeRemoveMemberModal,
		openUserProfile,
		openProfileItem,
		openRemoveMemberModal
	};
};
