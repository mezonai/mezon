import { useRoomContext } from '@livekit/components-react';
import { usePermissionChecker } from '@mezon/core';
import { handleAddAgentToVoice, handleKichAgentFromVoice, selectAllAccount, selectVoiceInfo, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import type { RemoteParticipant } from 'livekit-client';
import { memo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

export const AgentControl = memo(({ isExternalCalling }: { isExternalCalling: boolean }) => {
	const [hasChannelPermission] = usePermissionChecker([EPermission.manageChannel]);
	const account = useSelector(selectAllAccount);
	if ((!hasChannelPermission && !isExternalCalling) || (isExternalCalling && !account)) {
		return null;
	}
	return <ButtonAgent isExternalCalling={isExternalCalling} />;
});

const ButtonAgent = ({ isExternalCalling }: { isExternalCalling: boolean }) => {
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
		<div className="relative rounded-full bg-gray-300 dark:bg-black" onClick={handleAddAgent}>
			<div
				className={`w-14 aspect-square max-md:w-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none bg-zinc-500 dark:bg-zinc-900 lk-button ${onAgent ? '!bg-blue-500 hover:!bg-blue-600' : ''} ${disable || loading ? '!bg-slate-900 hover:!bg-slate-900 !cursor-default' : ''}`}
			>
				{loading ? (
					<Icons.LoadingSpinner />
				) : (
					<svg
						width="28px"
						height="28px"
						viewBox="0 0 24 24"
						className="group [&_path]:fill-white mb-1"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M9 15C8.44771 15 8 15.4477 8 16C8 16.5523 8.44771 17 9 17C9.55229 17 10 16.5523 10 16C10 15.4477 9.55229 15 9 15Z" />
						<path d="M14 16C14 15.4477 14.4477 15 15 15C15.5523 15 16 15.4477 16 16C16 16.5523 15.5523 17 15 17C14.4477 17 14 16.5523 14 16Z" />
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M12 1C10.8954 1 10 1.89543 10 3C10 3.74028 10.4022 4.38663 11 4.73244V7H6C4.34315 7 3 8.34315 3 10V20C3 21.6569 4.34315 23 6 23H18C19.6569 23 21 21.6569 21 20V10C21 8.34315 19.6569 7 18 7H13V4.73244C13.5978 4.38663 14 3.74028 14 3C14 1.89543 13.1046 1 12 1ZM5 10C5 9.44772 5.44772 9 6 9H7.38197L8.82918 11.8944C9.16796 12.572 9.86049 13 10.618 13H13.382C14.1395 13 14.832 12.572 15.1708 11.8944L16.618 9H18C18.5523 9 19 9.44772 19 10V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V10ZM13.382 11L14.382 9H9.61803L10.618 11H13.382Z"
						/>
						<path d="M1 14C0.447715 14 0 14.4477 0 15V17C0 17.5523 0.447715 18 1 18C1.55228 18 2 17.5523 2 17V15C2 14.4477 1.55228 14 1 14Z" />
						<path d="M22 15C22 14.4477 22.4477 14 23 14C23.5523 14 24 14.4477 24 15V17C24 17.5523 23.5523 18 23 18C22.4477 18 22 17.5523 22 17V15Z" />
					</svg>
				)}
			</div>
		</div>
	);
};
