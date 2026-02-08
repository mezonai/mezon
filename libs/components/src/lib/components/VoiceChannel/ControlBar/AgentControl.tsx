import { usePermissionChecker } from '@mezon/core';
import { handleAddAgentToVoice, handleKichAgentFromVoice, selectVoiceInfo, useAppDispatch } from '@mezon/store';
import { EPermission } from '@mezon/utils';
import { memo, useState } from 'react';
import { useSelector } from 'react-redux';

export const AgentControl = memo(() => {
	const [onAgent, setOnAgent] = useState(false);
	const currentVoice = useSelector(selectVoiceInfo);
	const [hasChannelPermission] = usePermissionChecker([EPermission.manageChannel]);
	const dispatch = useAppDispatch();
	const handleAddAgent = () => {
		if (!currentVoice) {
			return;
		}
		setOnAgent(!onAgent);

		if (!onAgent) {
			dispatch(handleAddAgentToVoice({ channel_id: currentVoice.channelId, room_name: currentVoice.roomId || '' }));
		} else {
			dispatch(handleKichAgentFromVoice({ channel_id: currentVoice.channelId, room_name: currentVoice.roomId || '' }));
		}
	};

	if (!hasChannelPermission) {
		return null;
	}
	return (
		<div className="relative rounded-full bg-gray-300 dark:bg-black" onClick={handleAddAgent}>
			<div
				className={`w-14 aspect-square max-md:w-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none bg-zinc-500 dark:bg-zinc-900 lk-button${onAgent ? '!bg-blue-500 hover:!bg-blue-600' : ''}`}
			>
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
			</div>
		</div>
	);
});
