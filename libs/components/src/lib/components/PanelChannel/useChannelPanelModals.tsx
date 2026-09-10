import { useChannels } from '@mezon/core';
import {
	channelsActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectWelcomeChannelByClanId,
	stickerSettingActions,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import type { IChannel } from '@mezon/utils';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import SettingChannel from '../ChannelSetting';
import ModalConfirm from '../ModalConfirm';

type UseChannelPanelModalsOptions = {
	onDeleteChannel?: () => void;
	onOpenSetting?: () => void;
};

export const useChannelPanelModals = (channel: IChannel, onClosePanel: () => void, options: UseChannelPanelModalsOptions = {}) => {
	const { onDeleteChannel, onOpenSetting } = options;

	const { t } = useTranslation('channelMenu');
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);
	const welcomeChannelId = useSelector((state) => selectWelcomeChannelByClanId(state, currentClanId as string));

	const isThread = !!channel.parent_id && channel.parent_id !== '0';

	const markModalOpen = useCallback(() => {
		dispatch(stickerSettingActions.openModalInChild());
	}, [dispatch]);

	const markModalClosed = useCallback(() => {
		dispatch(stickerSettingActions.closeModalInChild());
	}, [dispatch]);

	const handleArchiveChannel = async () => {
		try {
			await dispatch(channelsActions.archiveChannel({ channelId: channel.id, clanId: currentClanId as string })).unwrap();
			dispatch(
				toastActions.addToast({
					message: isThread ? t('toastArchiveThread') : t('toastArchiveChannel'),
					type: 'success',
					autoClose: 3000
				})
			);
			if (channel.id === currentChannelId) {
				navigate(`/chat/clans/${currentClanId}/channels/${isThread ? channel.parent_id : welcomeChannelId}`);
			}
		} catch (error) {
			// Ignored intentionally or handled globally
		} finally {
			handleCloseArchiveConfirm();
		}
	};

	const [showArchiveConfirm, hideArchiveConfirm] = useModal(() => {
		const keyPrefix = isThread ? 'modalConfirmArchiveThread' : 'modalConfirmArchiveChannel';

		return (
			<ModalConfirm
				handleCancel={handleCloseArchiveConfirm}
				handleConfirm={handleArchiveChannel}
				title={t(`${keyPrefix}.title`)}
				buttonName={t(`${keyPrefix}.button`)}
				message={t(`${keyPrefix}.textConfirm`)}
			/>
		);
	});

	function handleCloseArchiveConfirm() {
		markModalClosed();
		hideArchiveConfirm();
		onClosePanel();
	}

	const openArchiveConfirm = () => {
		markModalOpen();
		showArchiveConfirm();
	};

	const [showDeleteConfirm, hideDeleteConfirm] = useModal(
		() => (
			<DeleteChannelConfirm
				handleCancel={handleCloseDeleteConfirm}
				channelId={channel.channel_id as string}
				clanId={channel.clan_id as string}
				channelLabel={channel.channel_label || ''}
			/>
		),
		[channel.channel_id, channel.clan_id, channel.channel_label]
	);

	function handleCloseDeleteConfirm() {
		markModalClosed();
		hideDeleteConfirm();
		onClosePanel();
	}

	const openDeleteModal = () => {
		if (onDeleteChannel) {
			onDeleteChannel();
			return;
		}
		markModalOpen();
		showDeleteConfirm();
	};

	const [showSettingModal, hideSettingModal] = useModal(() => <SettingChannel onClose={handleCloseSettingModal} channel={channel} />, [channel]);

	function handleCloseSettingModal() {
		markModalClosed();
		hideSettingModal();
		onClosePanel();
	}

	const openSettingModal = () => {
		if (onOpenSetting) {
			onOpenSetting();
			onClosePanel();
			return;
		}
		markModalOpen();
		showSettingModal();
	};

	return { openArchiveConfirm, openDeleteModal, openSettingModal };
};

type DeleteChannelConfirmProps = {
	handleCancel: () => void;
	channelId: string;
	clanId: string;
	channelLabel: string;
};

const DeleteChannelConfirm = ({ handleCancel, channelId, clanId, channelLabel }: DeleteChannelConfirmProps) => {
	const { t } = useTranslation('channelSetting');
	const { handleConfirmDeleteChannel } = useChannels();

	const modalName = channelLabel || 'Unknown Channel';

	const handleDeleteChannel = () => {
		handleConfirmDeleteChannel(channelId, clanId);
		handleCancel();
	};

	return (
		<ModalConfirm
			handleCancel={handleCancel}
			handleConfirm={handleDeleteChannel}
			title={t('confirm.deleteChannel.title')}
			modalName={modalName}
			customTitle={t('confirm.deleteChannel.content', { channelName: modalName })}
		/>
	);
};
