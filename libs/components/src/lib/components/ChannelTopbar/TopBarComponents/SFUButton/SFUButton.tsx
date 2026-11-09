import { selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons24 } from '@mezon/ui';
import { useSelector } from 'react-redux';
import { useSFU } from '../../../SFU/SFUContext';
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

	const { setClanId, setChannelId } = useWebRTC();
	const { isJoined, startJoinSFU, quitSFU } = useSFU();

	return (
		<div className="relative flex gap-[15px] leading-5 h-5">
			<button
				title={isJoined ? 'Leave SFU' : 'Join SFU'}
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
						<MezonIcon icon={MzIcons16.mzLeave} className="dark:hover:text-white hover:text-black text-[var(--mz-icon)]" />
					</div>
				) : (
					<MezonIcon icon={MzIcons24.mzJoin} className="dark:hover:text-white hover:text-black text-[var(--mz-icon)]" />
				)}
			</button>
		</div>
	);
};
