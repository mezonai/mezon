import { ButtonCopy } from '@mezon/components';
import { useAuth } from '@mezon/core';
import { appActions, canvasAPIActions, useAppDispatch } from '@mezon/store';
import type { ICanvas } from '@mezon/utils';
import { generateE2eId } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ModalConfirm from '../../../../ModalConfirm';
type GroupCanvasProps = {
	canvas: ICanvas;
	channelId?: string;
	clanId: string;
	creatorIdChannel?: string;
	onClose: () => void;
	selectedCanvasId: string | null;
	onSelectCanvas: (canvasId: string) => void;
};

const GroupCanvas = ({ canvas, channelId, clanId, onClose, creatorIdChannel, selectedCanvasId, onSelectCanvas }: GroupCanvasProps) => {
	const { t } = useTranslation('common');
	const canvasId = canvas.id;
	const { canvasId: currentCanvasId } = useParams<{ canvasId: string }>();
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const isDisableDelCanvas = Boolean(
		canvas.creator_id && canvas.creator_id !== userProfile?.user?.id && creatorIdChannel !== userProfile?.user?.id
	);

	const handleOpenCanvas = async () => {
		dispatch(appActions.setIsShowCanvas(true));
		onClose();
	};

	const handleCanvasClick = () => {
		if (canvasId) {
			onSelectCanvas(canvasId);
			handleOpenCanvas();
		}
	};

	const handleDeleteCanvas = async () => {
		if (canvasId && channelId && clanId) {
			const body = {
				id: canvasId,
				channel_id: channelId,
				clan_id: clanId
			};
			await dispatch(canvasAPIActions.deleteCanvas(body));
			dispatch(canvasAPIActions.removeOneCanvas({ channelId, canvasId }));
			if (currentCanvasId === canvasId) {
				dispatch(appActions.setIsShowCanvas(false));
				const redirectPath =
					canvas.parent_id && canvas.parent_id !== '0'
						? `/chat/clans/${clanId}/channels/${channelId}`
						: `/chat/clans/${clanId}/channels/${channelId}`;
				navigate(redirectPath);
			}
		}
		setShowConfirmModal(false);
	};

	const isSelected = selectedCanvasId === canvasId && canvasId;
	const link =
		canvas.parent_id && canvas.parent_id !== '0'
			? `/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`
			: `/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`;

	return (
		<>
			<div className="w-full flex gap-2 relative" data-e2e={generateE2eId('chat.channel_message.header.button.canvas.item')}>
				<Link
					className={`w-full py-2 pl-4 pr-4 cursor-pointer rounded-lg border-theme-primary ${
						currentCanvasId === canvasId ? 'bg-item-theme text-theme-primary-active ' : 'bg-item-hover'
					}`}
					role="button"
					to={link}
					onClick={handleOpenCanvas}
				>
					<div
						className="h-6 text-xs one-line font-semibold leading-6 "
						data-e2e={generateE2eId('chat.channel_message.header.button.canvas.item.title')}
					>
						{canvas.title ? canvas.title : 'Untitled'}
					</div>
				</Link>
				<ButtonCopy
					copyText={process.env.NX_CHAT_APP_REDIRECT_URI + link}
					className={`absolute top-2 !rounded-full overflow-hidden  ${!isDisableDelCanvas ? 'right-[35px]' : 'right-[5px]'}  `}
				/>
				{!isDisableDelCanvas && (
					<button
						title="Delete Canvas"
						onClick={() => setShowConfirmModal(true)}
						className="absolute top-1/2 -translate-y-1/2 right-2 group flex items-center justify-center w-6 h-6 rounded-full bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
						data-e2e={generateE2eId('chat.channel_message.header.button.canvas.item.button.delete')}
					>
						<svg
							className="w-3.5 h-3.5 text-red-500 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2.5}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				)}
			</div>

			{showConfirmModal && (
				<ModalConfirm
					handleCancel={() => setShowConfirmModal(false)}
					handleConfirm={handleDeleteCanvas}
					modalName={canvas.title || 'Untitled'}
					title="Delete"
					buttonName="Delete"
					message={t('canvas.deleteMessage')}
				/>
			)}
		</>
	);
};

export default GroupCanvas;
