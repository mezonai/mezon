import { useRoomContext } from '@livekit/components-react';
import { usePermissionChecker } from '@mezon/core';
import { handleAddAgentToVoice, handleKichAgentFromVoice, selectAllAccount, selectVoiceInfo, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import type { RemoteParticipant } from 'livekit-client';
import { memo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

export const AgentControl = memo(({ isExternalCalling, isShowMember }: { isExternalCalling: boolean; isShowMember: boolean }) => {
	const [hasChannelPermission] = usePermissionChecker([EPermission.manageChannel]);
	const account = useSelector(selectAllAccount);
	if ((!hasChannelPermission && !isExternalCalling) || (isExternalCalling && !account)) {
		return null;
	}
	return <ButtonAgent isExternalCalling={isExternalCalling} isShowMember={isShowMember} />;
});

const ButtonAgent = ({ isExternalCalling, isShowMember }: { isExternalCalling: boolean; isShowMember: boolean }) => {
	const room = useRoomContext();
	const [onAgent, setOnAgent] = useState(false);
	const currentVoice = useSelector(selectVoiceInfo);
	const countRef = useRef(0);
	const timerCount = useRef<NodeJS.Timeout | null>(null);
	const [disable, setDisable] = useState(false);
	const [loading, setLoading] = useState(false);
	const timerLoading = useRef<NodeJS.Timeout | null>(null);
	const dispatch = useAppDispatch();
	const handleAddAgent = async () => {
		if (isExternalCalling) {
			const room_name = room?.name;
			if (!onAgent) {
				dispatch(handleAddAgentToVoice({ channel_id: currentVoice?.channelId || '0', room_name: room_name || '' }));
			} else {
				dispatch(handleKichAgentFromVoice({ channel_id: currentVoice?.channelId || '0', room_name: room_name || '' }));
			}
		}
		if (!currentVoice || disable) {
			return;
		}
		setLoading(true);
		if (!onAgent) {
			dispatch(handleAddAgentToVoice({ channel_id: currentVoice?.channelId || '', room_name: currentVoice?.roomId || '' }));
		} else {
			dispatch(handleKichAgentFromVoice({ channel_id: currentVoice?.channelId || '', room_name: currentVoice?.roomId || '' }));
		}
		timerLoading.current = setTimeout(() => {
			setLoading(false);
		}, 5000);
	};

	useEffect(() => {
		if (!room) return;

		const handleJoin = (p: RemoteParticipant) => {
			if (p.isAgent) {
				setOnAgent(true);
				setLoading(false);
			}
			if (timerLoading.current) {
				clearTimeout(timerLoading.current);
			}
		};
		const handleDisconnect = (p: RemoteParticipant) => {
			if (p.isAgent) {
				setOnAgent(false);
				setLoading(false);
			}
			if (timerLoading.current) {
				clearTimeout(timerLoading.current);
			}
		};

		const onConnected = () => {
			const hasAgent = [...room.remoteParticipants.values()].some((p) => p.isAgent);

			setOnAgent(hasAgent);
		};

		room.on('participantConnected', handleJoin);
		room.on('participantDisconnected', handleDisconnect);
		room.on?.('connected', onConnected);

		return () => {
			room.off('participantConnected', handleJoin);
			room.off('participantDisconnected', handleDisconnect);
			room.off?.('connected', onConnected);
		};
	}, [room]);

	useEffect(() => {
		if (countRef.current >= 10) {
			setDisable(true);
			if (timerCount.current) {
				clearTimeout(timerCount.current);
			}

			timerCount.current = setTimeout(() => {
				setDisable(false);
				countRef.current = 0;
			}, 20000);

			return;
		}

		countRef.current = countRef.current + 1;

		return () => {
			if (timerCount.current) {
				clearTimeout(timerCount.current);
			}
		};
	}, [onAgent]);

	return (
		<div className="relative rounded-full " onClick={handleAddAgent}>
			<div
				className={`w-14 h-14 max-md:w-10 max-md:h-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none lk-button ${isShowMember ? 'bg-zinc-700 dark:bg-zinc-900' : 'bg-zinc-900'} ${onAgent ? '!bg-[#1f8cf9] hover:!bg-[#3396fa]' : ''} ${disable || loading ? '!bg-slate-900 hover:!bg-slate-900 !cursor-default' : ''}`}
			>
				{loading ? (
					<Icons.LoadingSpinner />
				) : (
					<svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 226 183" fill="none">
						<g>
							<path
								d="M73.91 180.56c-17.45-4.82-32.7-21.15-35.91-38.45-.55-2.96-1-19.63-1-37.04 0-24.8.32-32.89 1.49-37.37 6.27-24.07 26.35-38.66 53.26-38.69L98 29l.02-7.25c.03-9.16 2.36-14.67 7.65-18.09 7.25-4.69 15.04-4.3 21.42 1.07 4.41 3.71 5.91 7.96 5.91 16.74V29l4.25.01c19.78.03 38.59 10.82 46.63 26.75 5.73 11.36 6.12 14.49 6.12 49.31 0 17.41-.45 34.08-1 37.04-3.25 17.55-18.57 33.76-36.37 38.5-7.01 1.87-71.91 1.82-78.72-.05m-57.69-44.1C6.67 130.03 0 117.5 0 106c0-6.66 3.35-16.61 7.49-22.21C10.87 79.21 20.19 72 22.74 72c.99 0 1.26 7.28 1.26 34s-.27 34-1.26 34c-.7 0-3.63-1.59-6.52-3.54M202 105c0-26.72.27-34 1.26-34 2.55 0 11.87 7.21 15.25 11.79 4.14 5.6 7.49 15.55 7.49 22.21s-3.35 16.61-7.49 22.21c-3.38 4.58-12.7 11.79-15.25 11.79-.99 0-1.26-7.28-1.26-34m-63.54 6.14c10 6.09 24.54-2.91 24.54-15.19 0-5.2-3.88-12.32-7.82-14.36-7.78-4.02-16.01-2.74-21.52 3.36-7.58 8.39-5.47 19.93 4.8 26.19m-65.05-.03c6.81 4.15 16.68 1.75 21.93-5.35 2.93-3.95 3.38-13.16.87-17.76-5.31-9.71-18.88-11.53-26.81-3.6-7.87 7.87-5.95 20.63 4.01 26.71m25.76 24.58c2.06 2.18 2.89 2.31 15 2.31 11.5 0 13.04-.21 14.83-2 2.43-2.43 2.57-5.71.35-8.17-1.45-1.6-3.34-1.83-14.78-1.83-10.26 0-13.61.34-15.35 1.56-2.82 1.97-2.83 5.16-.05 8.13"
								fill="rgba(254,254,254,1)"
								className="icon-AgentControl-fill-1"
							/>
							<path
								d="M99.17 135.69c-2.78-2.97-2.77-6.16.05-8.13 1.74-1.22 5.09-1.56 15.35-1.56 11.44 0 13.33.23 14.78 1.83 2.22 2.46 2.08 5.74-.35 8.17-1.79 1.79-3.33 2-14.83 2-12.11 0-12.94-.13-15-2.31m-25.76-24.58c-9.96-6.08-11.88-18.84-4.01-26.71 7.93-7.93 21.5-6.11 26.81 3.6 2.51 4.6 2.06 13.81-.87 17.76-5.25 7.1-15.12 9.5-21.93 5.35m65.05.03c-10.27-6.26-12.38-17.8-4.8-26.19 5.51-6.1 13.74-7.38 21.52-3.36 3.94 2.04 7.82 9.16 7.82 14.36 0 12.28-14.54 21.28-24.54 15.19"
								fill="rgba(96,96,101,1)"
								className="icon-AgentControl-fill-2"
							/>
						</g>
					</svg>
				)}
			</div>
		</div>
	);
};
