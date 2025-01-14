import { selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { Icons } from '@mezon/ui';
import Tippy from '@tippy.js/react';
import { useSelector } from 'react-redux';
import { usePushToTalk } from '../../../SFU/SFUContext';
import { useWebRTC } from '../../../WebRTC/WebRTCContext';

export interface ISFUBtnProps {
	isLightMode: boolean;
}

export interface ISFUBtnProps {
	isLightMode: boolean;
}

export const SFUBtn: React.FC<ISFUBtnProps> = ({ isLightMode }) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);

	const { setClanId, setChannelId, channelId } = useWebRTC();
	const { isJoined, startJoinSFU, quitSFU } = usePushToTalk();

	return (
		<div className="relative flex gap-[15px] leading-5 h-5">
			<Tippy
				className={`w-[140px] flex justify-center items-center ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}
				content={isJoined ? 'Leave SFU' : 'Join SFU'}
			>
				<button
					onClick={
						!isJoined
							? () => {
									setClanId(currentClanId || '');
									setChannelId(currentChannelId || '');
									startJoinSFU();
								}
							: quitSFU
					}
					className="focus-visible:outline-none"
					onContextMenu={(e) => e.preventDefault()}
				>
					{isJoined ? (
						<div className="size-6 flex items-center justify-center">
							<Icons.JoinedSFU className="size-4 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
						</div>
					) : (
						<Icons.NotJoinedSFU className="size-6 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
					)}
				</button>
			</Tippy>
		</div>
	);
};
