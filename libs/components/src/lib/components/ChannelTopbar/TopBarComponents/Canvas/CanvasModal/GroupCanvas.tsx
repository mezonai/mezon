import { useAuth } from '@mezon/core';
import { appActions, canvasActions, canvasAPIActions, selectIdCanvas, useAppDispatch } from '@mezon/store';
import { generateE2eId, ICanvas } from '@mezon/utils';
import { ButtonCopy } from 'libs/components/src/lib/components';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
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
	const canvasId = canvas.id;
	const currentIdCanvas = useSelector(selectIdCanvas);
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const isDisableDelCanvas = Boolean(
		canvas.creator_id && canvas.creator_id !== userProfile?.user?.id && creatorIdChannel !== userProfile?.user?.id
	);

	const handleOpenCanvas = async () => {
		dispatch(appActions.setIsShowCanvas(true));
		dispatch(canvasActions.setIdCanvas(canvasId || ''));
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
			if (currentIdCanvas === canvasId) {
				dispatch(appActions.setIsShowCanvas(false));
				const redirectPath =
					canvas.parent_id && canvas.parent_id !== '0'
						? `/chat/clans/${clanId}/threads/${channelId}`
						: `/chat/clans/${clanId}/channels/${channelId}`;
				navigate(redirectPath);
			}
		}
	};

	const isSelected = selectedCanvasId === canvasId && canvasId;
	const link =
		canvas.parent_id && canvas.parent_id !== '0'
			? `/chat/clans/${clanId}/threads/${channelId}/canvas/${canvasId}`
			: `/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`;

	return (
		<div className="w-full flex gap-2 relative" data-e2e={generateE2eId('chat.channel_message.header.button.canvas.item')}>
			<Link
				className={`w-full py-2 pl-4 pr-4 cursor-pointer rounded-lg border-theme-primary ${
					currentIdCanvas === canvasId ? 'bg-item-theme text-theme-primary-active ' : 'bg-item-hover'
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
					onClick={handleDeleteCanvas}
					className="absolute top-[9px] right-[5px]  bg-white dark:bg-transparent text-red-600 shadow-emoji_item-delete text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
					data-e2e={generateE2eId('chat.channel_message.header.button.canvas.item.button.delete')}
				>
					X
				</button>
			)}
		</div>
	);
};

export default GroupCanvas;
