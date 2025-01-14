import { useAuth } from '@mezon/core';
import { appActions, canvasActions, canvasAPIActions, selectIdCanvas, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ICanvas } from '@mezon/utils';
import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
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
		if (canvasId && channelId && clanId) {
			const body = {
				id: canvasId,
				channel_id: channelId,
				clan_id: clanId
			};
			const results = await dispatch(canvasAPIActions.getChannelCanvasDetail(body));
			const dataUpdate = results?.payload;
			dispatch(canvasAPIActions.updateCanvas({ channelId, dataUpdate }));
		}
	};

	const handleDeleteCanvas = async () => {
		if (canvasId && channelId && clanId) {
			const body = {
				id: canvasId,
				channel_id: channelId,
				clan_id: clanId
			};
			const results = await dispatch(canvasAPIActions.deleteCanvas(body));
			dispatch(canvasAPIActions.removeOneCanvas({ channelId, canvasId }));
			if (currentIdCanvas === canvasId) {
				dispatch(appActions.setIsShowCanvas(false));
			}
		}
	};

	return (
		<div className="w-full flex gap-2 relative">
			<div
				className="w-full pt-1 pb-1 pl-4 pr-4 cursor-pointer rounded-lg dark:bg-bgPrimary bg-bgLightPrimary border border-transparent dark:hover:border-bgModifierHover hover:border-bgModifierHover hover:bg-bgLightModeButton"
				role="button"
			>
				<Link to={`/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`} onClick={handleOpenCanvas}>
					<div className="h-6 text-xs one-line font-semibold leading-6 dark:text-bgLightPrimary text-bgPrimary">
						{canvas.title ? canvas.title : 'Untitled'}
					</div>
				</Link>
			</div>
			<CopyToClipboard
				text={process.env.NX_CHAT_APP_REDIRECT_URI + `/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`}
				onCopy={() => setIsCopied(true)}
			>
				<button
					style={{ top: '5px' }}
					className={`absolute top-0 dark:border-black dark:shadow-[#000000] bg-white dark:bg-transparent shadow-emoji_item-delete font-bold w-6 h-6 flex items-center justify-center rounded-full ${!isDisableDelCanvas ? 'right-[35px]' : 'right-[5px]'}`}
				>
					{isCopied ? <Icons.PasteIcon /> : <Icons.CopyLink className="w-4 h-4" />}
				</button>
			</CopyToClipboard>
			{!isDisableDelCanvas && (
				<button
					title="Delete Canvas"
					style={{ top: '5px' }}
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
