import { useAuth } from '@mezon/core';
import { appActions, canvasActions, canvasAPIActions, selectIdCanvas, useAppDispatch } from '@mezon/store';
import { ICanvas } from '@mezon/utils';
import { ButtonCopy } from 'libs/components/src/lib/components';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
type GroupCanvasProps = {
	canvas: ICanvas;
	channelId?: string;
	clanId: string;
	creatorIdChannel?: string;
	onClose: () => void;
};

const GroupCanvas = ({ canvas, channelId, clanId, onClose, creatorIdChannel }: GroupCanvasProps) => {
	const canvasId = canvas.id;
	const currentIdCanvas = useSelector(selectIdCanvas);
	const { userProfile } = useAuth();
	const [isCopied, setIsCopied] = useState(false);
	const dispatch = useAppDispatch();
	const isDisableDelCanvas = Boolean(
		canvas.creator_id && canvas.creator_id !== userProfile?.user?.id && creatorIdChannel !== userProfile?.user?.id
	);

	const handleOpenCanvas = async () => {
		dispatch(appActions.setIsShowCanvas(true));
		dispatch(canvasActions.setIdCanvas(canvasId || ''));
		onClose();
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
			}
		}
	};

	const link =
		canvas.parent_id && canvas.parent_id !== '0'
			? `/chat/clans/${clanId}/threads/${channelId}/canvas/${canvasId}`
			: `/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`;

	return (
		<div className="w-full flex gap-2 relative">
			<Link
				className="w-full py-2 pl-4 pr-4 cursor-pointer rounded-lg dark:bg-bgPrimary bg-bgLightPrimary border border-transparent dark:hover:border-bgModifierHover hover:border-bgModifierHover hover:bg-bgLightModeButton"
				role="button"
				to={link}
				onClick={handleOpenCanvas}
			>
				<div className="h-6 text-xs one-line font-semibold leading-6 dark:text-bgLightPrimary text-bgPrimary">
					{canvas.title ? canvas.title : 'Untitled'}
				</div>
			</Link>
			<ButtonCopy
				copyText={process.env.NX_CHAT_APP_REDIRECT_URI + link}
				className={`absolute top-2 !rounded-full overflow-hidden dark:border-black dark:shadow-[#000000] ${!isDisableDelCanvas ? 'right-[35px]' : 'right-[5px]'}  `}
			/>
			{!isDisableDelCanvas && (
				<button
					title="Delete Canvas"
					style={{ top: '9px' }}
					onClick={handleDeleteCanvas}
					className="absolute top-0 right-[5px] dark:border-black dark:shadow-[#000000] bg-white dark:bg-transparent text-red-600 shadow-emoji_item-delete text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
				>
					X
				</button>
			)}
		</div>
	);
};

export default GroupCanvas;
