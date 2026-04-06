import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { useModal } from 'react-modal-hook';
import RemoveFriendModal from '../components/RemoveFriendModal';

export type RemoveFriendPayload = {
	username?: string;
	id?: string;
	displayName?: string;
	titleText?: string;
	descriptionText?: string | ReactNode;
	confirmText?: string;
};

type UseRemoveFriendModalReturn = {
	openRemoveFriendModal: (payload?: RemoveFriendPayload) => void;
};

export const useRemoveFriendModal = (onConfirmRemove: (username: string, userId: string) => void): UseRemoveFriendModalReturn => {
	const [friendToRemove, setFriendToRemove] = useState<RemoveFriendPayload | null>(null);

	const [showRemoveFriendModal, hideRemoveFriendModal] = useModal(
		() =>
			friendToRemove ? (
				<RemoveFriendModal
					username={friendToRemove.username}
					displayName={friendToRemove.displayName}
					titleText={friendToRemove.titleText}
					descriptionText={friendToRemove.descriptionText}
					confirmText={friendToRemove.confirmText}
					onClose={() => {
						hideRemoveFriendModal();
						setFriendToRemove(null);
					}}
					onConfirm={() => {
						if (!friendToRemove?.username || !friendToRemove?.id) return;
						onConfirmRemove(friendToRemove.username, friendToRemove.id);
						hideRemoveFriendModal();
						setFriendToRemove(null);
					}}
				/>
			) : null,
		[friendToRemove, onConfirmRemove]
	);

	const openRemoveFriendModal = useCallback(
		(payload?: RemoveFriendPayload) => {
			if (!payload?.username || !payload?.id) return;
			setFriendToRemove(payload);
			showRemoveFriendModal();
		},
		[showRemoveFriendModal]
	);

	return { openRemoveFriendModal };
};
