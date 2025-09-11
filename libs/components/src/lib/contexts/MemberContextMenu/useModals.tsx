import type { ChannelMembersEntity } from '@mezon/store';
import { clansActions, getStore, selectCurrentClanId, toastActions, useAppDispatch } from '@mezon/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { ModalUserProfile } from '../../components';
import UserProfileModalInner from '../../components/UserProfileModalInner/index';

export interface ModalsProps {
	currentUser: ChannelMembersEntity | null;
}

export interface ModalsState {
	modalState: React.MutableRefObject<{
		profileItem: boolean;
		userProfile: boolean;
	}>;
	currentUser: ChannelMembersEntity | null;
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

export const useModals = ({ currentUser }: ModalsProps): ModalsState => {
	const [positionShortUser, setPositionShortUser] = useState<{ top: number; left: number } | null>(null);
	const [openModalRemoveMember, setOpenModalRemoveMember] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const [popupHeight, setPopupHeight] = useState<number>(500);

	const modalState = useRef({
		profileItem: false,
		userProfile: false
	});
	const parentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const updateHeight = () => {
			if (parentRef.current) {
				const height = parentRef.current.getBoundingClientRect().height;
				if (height > 0) {
					setPopupHeight(height);
				}
			}
		};

		const resizeObserver = new ResizeObserver(() => {
			updateHeight();
		});

		if (parentRef.current) {
			resizeObserver.observe(parentRef.current);
		}

		updateHeight();

		return () => {
			if (parentRef.current) {
				resizeObserver.unobserve(parentRef.current);
			}
		};
	}, [currentUser]);

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
				ref={parentRef}
				className="fixed z-50 max-[480px]:!left-16 max-[700px]:!left-9 bg-outside-footer w-[300px] max-w-[89vw] rounded-lg flex flex-col duration-300 ease-in-out animate-fly_in"
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
		dispatch(
			toastActions.addToast({
				message: 'Member removed successfully',
				type: 'success'
			})
		);
		setOpenModalRemoveMember(false);
	};

	const openUserProfile = useCallback(
		(user: ChannelMembersEntity, avatar?: string) => {
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

			if (top + popupHeight + padding > windowHeight) {
				top = windowHeight - popupHeight - padding;
			}

			if (top < padding) {
				top = padding;
			}

			setPositionShortUser({
				top,
				left
			});

			showProfileItemModal();
		},
		[showProfileItemModal]
	);

	const openRemoveMemberModal = useCallback(
		(user: ChannelMembersEntity) => {
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
