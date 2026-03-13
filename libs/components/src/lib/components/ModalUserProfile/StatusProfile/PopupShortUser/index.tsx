import { useFriends } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import ItemPanel from '../../../PanelChannel/ItemPanel';
import RemoveFriendModal from '../../../RemoveFriendModal';

export const PopupFriend = ({ user, showPopupLeft }: { user: ChannelMembersEntity | null; showPopupLeft?: boolean }) => {
	const { deleteFriend } = useFriends();
	const { t } = useTranslation('userProfile');
	const [showRemoveFriendModal, hideRemoveFriendModal] = useModal(
		() =>
			user?.user?.username && user?.user?.id ? (
				<RemoveFriendModal
					username={user.user.username}
					displayName={user.user.display_name}
					onClose={hideRemoveFriendModal}
					onConfirm={() => {
						deleteFriend(user.user?.username || '', user.user?.id || '');
						hideRemoveFriendModal();
					}}
				/>
			) : null,
		[user, deleteFriend]
	);
	return (
		<div
			className={`absolute top-0  rounded-lg bg-theme-surface shadow w-[165px] p-2 z-[1] ${showPopupLeft ? 'right-9' : 'sbm:left-9 right-9'}`}
			onClick={() => {
				if (user?.user?.username && user?.user?.id) {
					showRemoveFriendModal();
				}
			}}
		>
			<ItemPanel children={t('pendingContent.removeFriend')} />
		</div>
	);
};

type PopupOptionProps = {
	showPopupLeft?: boolean;
	isMe: boolean;
};

export const PopupOption = ({ showPopupLeft, isMe }: PopupOptionProps) => {
	const { t } = useTranslation('userProfile');
	return (
		<div
			className={`absolute top-0 dark:bg-bgProfileBody bg-gray-100 rounded-sm shadow w-[165px] p-2 z-[1] ${showPopupLeft ? 'right-9' : 'sbm:left-9 right-9'}`}
		>
			{!showPopupLeft && <ItemPanel children={t('pendingContent.viewFullProfile')} />}
			{!isMe && (
				<>
					<ItemPanel children={t('pendingContent.block')} danger />
					<ItemPanel children={t('pendingContent.reportUserProfile')} danger />
				</>
			)}
		</div>
	);
};
