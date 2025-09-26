import { useAppNavigation, useEscapeKeyClose } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import {
	channelsActions,
	defaultNotificationCategoryActions,
	selectChannelById,
	selectChannelFirst,
	selectChannelSecond,
	selectCurrentChannelId,
	selectCurrentClanId,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { checkIsThread } from '@mezon/utils';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

interface DeleteModalProps {
	onClose: () => void;
	onCloseModal?: () => void;
	channelLabel: string;
	channelId: string;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ onClose, onCloseModal, channelLabel, channelId }) => {
	const { t } = useTranslation('channelSetting');
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const channelFirst = useSelector(selectChannelFirst);
	const channelSecond = useSelector(selectChannelSecond);
	let channelNavId = channelFirst.id;

	const selectedChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	const isThread = checkIsThread(selectedChannel as ChannelsEntity);

	const { toChannelPage } = useAppNavigation();
	const navigate = useNavigate();

	const handleDeleteChannel = async (channelId: string) => {
		await dispatch(channelsActions.deleteChannel({ channelId, clanId: currentClanId as string }));

		if (isThread) {
			const parentChannelId = (selectedChannel?.parent_id as string) || '';
			const threadId = selectedChannel?.id as string;
			if (parentChannelId && threadId) {
				await dispatch(threadsActions.remove(threadId));
				await dispatch(threadsActions.removeThreadFromCache({ channelId: parentChannelId, threadId }));
			}

			dispatch(
				defaultNotificationCategoryActions.fetchChannelCategorySetting({
					clanId: currentClanId as string,
					noCache: true
				})
			);
		}
		if (channelId === currentChannelId) {
			if (currentChannelId === channelNavId) {
				channelNavId = channelSecond.id;
			}
			const channelPath = toChannelPage(channelNavId ?? '', currentClanId ?? '');
			navigate(channelPath);
		}
		onClose();
		if (onCloseModal) {
			onCloseModal();
		}
	};

	useEffect(() => {
		const handleEnterKey = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				handleDeleteChannel(channelId);
			}
		};

		document.addEventListener('keydown', handleEnterKey);
		return () => {
			document.removeEventListener('keydown', handleEnterKey);
		};
	}, [handleDeleteChannel]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	return (
		<div ref={modalRef} tabIndex={-1} className="fixed  inset-0 flex items-center justify-center z-50 dark:text-white text-black">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<div className="bg-theme-setting-primary relative z-10  p-6 rounded-[5px] text-center">
				<h2 className="text-[30px] font-semibold mb-4">{isThread ? t('confirm.deleteThread.title') : t('confirm.deleteChannel.title')}</h2>
				<p className="text-white-600 mb-6 text-[16px]">
					{isThread
						? t('confirm.deleteThread.content', { channelName: channelLabel })
						: t('confirm.deleteChannel.content', { channelName: channelLabel })}
				</p>
				<div className="flex justify-center mt-10 text-[14px]">
					<button
						color="gray"
						onClick={onClose}
						className="px-4 py-2 mr-5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring focus:border-blue-300"
					>
						{t('confirm.cancel')}
					</button>
					<button
						color="blue"
						onClick={() => handleDeleteChannel(channelId)}
						className="px-4 py-2 bg-colorDanger dark:bg-colorDanger text-white rounded hover:bg-blue-500 focus:outline-none focus:ring focus:border-blue-300"
					>
						{isThread ? t('confirm.deleteThread.confirmText') : t('confirm.deleteChannel.confirmText')}
					</button>
				</div>
			</div>
		</div>
	);
};
