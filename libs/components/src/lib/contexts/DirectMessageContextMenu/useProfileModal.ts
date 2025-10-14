import { useModal } from 'react-modal-hook';
import UserProfileModalInner from '../../components/UserProfileModalInner';

interface UseProfileModalParams {
	currentUser: any;
}

export function useProfileModal({ currentUser }: UseProfileModalParams) {
	const [openUserProfile, closeUserProfile] = useModal(() => {
		if (!currentUser) return null;

		const userId = currentUser?.user_ids?.[0] || currentUser?.id;
		const directId = (currentUser as any)?.channel_id || currentUser?.channelId;
		const avatar = currentUser?.avatar_url || currentUser?.avatars?.[0];
		const name = currentUser?.display_name || currentUser?.username || currentUser?.display_names?.[0];
		const isOnline = !!currentUser?.online?.[0];
		const isMobile = currentUser?.is_mobile;

		return UserProfileModalInner({
			userId,
			directId,
			onClose: closeUserProfile,
			isDM: true,
			user: currentUser,
			avatar,
			name,
			status: {
				status: isOnline,
				isMobile
			}
		});
	}, [currentUser]);

	return {
		openUserProfile,
		closeUserProfile
	};
}
