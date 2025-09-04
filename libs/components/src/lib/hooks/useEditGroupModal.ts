import { directActions, useAppDispatch } from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { ValidateSpecialCharacters } from '@mezon/utils';
import { useCallback, useEffect, useState } from 'react';

export interface UseEditGroupModalProps {
	channelId?: string;
	currentGroupName?: string;
	currentAvatar?: string;
}

export interface UseEditGroupModalReturn {
	isEditModalOpen: boolean;
	groupName: string;
	imagePreview: string;
	selectedFile: File | null;

	openEditModal: () => void;
	closeEditModal: () => void;
	setGroupName: (name: string) => void;
	handleImageUpload: (file: File | null) => void;
	handleSave: () => Promise<void>;

	hasChanges: boolean;
}

export const useEditGroupModal = ({ channelId, currentGroupName = '', currentAvatar = '' }: UseEditGroupModalProps): UseEditGroupModalReturn => {
	const dispatch = useAppDispatch();
	const { sessionRef, clientRef } = useMezon();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [groupName, setGroupName] = useState('');
	const [avatarState, setAvatarState] = useState<{
		preview: string;
		file: File | null;
		action: 'none' | 'upload' | 'remove';
	} | null>(null);

	const hasChanges = Boolean(isEditModalOpen && (groupName.trim() !== currentGroupName || (avatarState && avatarState.action !== 'none')));

	const openEditModal = useCallback(() => {
		setGroupName(currentGroupName);
		setAvatarState({
			preview: currentAvatar,
			file: null,
			action: 'none'
		});
		setIsEditModalOpen(true);
	}, [currentGroupName, currentAvatar]);

	const closeEditModal = useCallback(() => {
		setIsEditModalOpen(false);
	}, []);

	const handleImageUpload = useCallback(
		(file: File | null) => {
			if (!avatarState) return;

			if (file === null) {
				setAvatarState({
					preview: '',
					file: null,
					action: 'remove'
				});
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				if (result) {
					setAvatarState({
						preview: result,
						file: file,
						action: 'upload'
					});
				}
			};
			reader.readAsDataURL(file);
		},
		[avatarState]
	);

	const handleSave = useCallback(async () => {
		const value = groupName.trim();
		const regex = ValidateSpecialCharacters();

		if (!regex.test(value)) {
			console.error('Invalid channel name');
			return;
		}

		if (!avatarState) return;

		const hasNameChanged = value !== currentGroupName;

		if ((hasNameChanged || avatarState.action !== 'none') && channelId) {
			let avatarUrl = currentAvatar;

			if (avatarState.action === 'remove') {
				avatarUrl = '';
			} else if (avatarState.action === 'upload' && avatarState.file) {
				try {
					const client = clientRef.current;
					const session = sessionRef.current;

					if (!client || !session) {
						console.error('Client/session not ready');
						return;
					}

					const ext = avatarState.file.name.split('.').pop() || 'jpg';
					const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
					const path = `dm-group-avatar/${channelId || 'temp'}/${unique}.${ext}`;

					const attachment = await handleUploadEmoticon(client, session, path, avatarState.file);

					if (attachment && attachment.url) {
						avatarUrl = attachment.url;
					} else {
						return;
					}
				} catch (error) {
					console.error('Failed to upload image:', error);
					return;
				}
			}

			const payload: { channel_id: string; channel_label?: string; topic?: string } = { channel_id: channelId };
			if (hasNameChanged) payload.channel_label = value;
			if (avatarState.action !== 'none') payload.topic = avatarUrl;

			dispatch(directActions.updateDmGroup(payload));
		}

		closeEditModal();
	}, [groupName, avatarState, currentGroupName, currentAvatar, channelId, dispatch, closeEditModal, clientRef, sessionRef]);

	useEffect(() => {
		if (!isEditModalOpen) return;
		setGroupName(currentGroupName);
		setAvatarState((prev) => ({
			preview: currentAvatar,
			file: prev?.file ?? null,
			action: prev?.action ?? 'none'
		}));
	}, [isEditModalOpen, currentGroupName, currentAvatar]);

	return {
		isEditModalOpen,
		groupName,
		imagePreview: avatarState?.preview || '',
		selectedFile: avatarState?.file || null,

		openEditModal,
		closeEditModal,
		setGroupName,
		handleImageUpload,
		handleSave,

		hasChanges
	};
};
