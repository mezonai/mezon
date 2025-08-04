import { selectIsGroupCallActive, selectJoinedCall, selectMemberDMByUserId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { WebrtcSignalingFwd } from 'mezon-js';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { useGroupCallAudio } from './hooks/useGroupCallAudio';
import { useGroupCallSignaling } from './hooks/useGroupCallSignaling';
import { useGroupCallState } from './hooks/useGroupCallState';
import { CallSignalingData, createQuitData, parseSignalingData } from './utils/callDataUtils';

interface ModalCallProps {
	dataCall: WebrtcSignalingFwd;
	userId: string;
}

const GroupPopupNotiCall = ({ dataCall, userId }: ModalCallProps) => {
	const user = useAppSelector((state) => selectMemberDMByUserId(state, dataCall?.caller_id));
	const isJoinedCall = useSelector(selectJoinedCall);
	const isGroupCallActive = useSelector(selectIsGroupCallActive);

	const groupCallState = useGroupCallState();
	const groupCallAudio = useGroupCallAudio();
	const groupCallSignaling = useGroupCallSignaling();

	const callData = useMemo(() => {
		return parseSignalingData(dataCall?.json_data as string);
	}, [dataCall?.json_data]);

	const { groupName, memberCount, isVideoCall } = useMemo(
		() => ({
			groupName: callData?.group_name || 'Group Call',
			memberCount: callData?.participants?.length || 0,
			isVideoCall: callData?.is_video || false
		}),
		[callData]
	);

	useEffect(() => {
		if (isJoinedCall && !isGroupCallActive) {
			// groupCallState.endGroupCall();
			// groupCallAudio.stopAllAudio();
		}
	}, [isGroupCallActive, isJoinedCall, groupCallState, groupCallAudio]);

	const handleJoinCall = async () => {
		if (dataCall?.channel_id && callData) {
			groupCallState.setIncomingCallData({
				groupId: dataCall.channel_id,
				groupName: callData.group_name || 'Group Call',
				groupAvatar: callData.group_avatar,
				meetingCode: callData.meeting_code,
				clanId: callData.clan_id,
				participants: callData.participants || [],
				callerInfo: {
					id: callData.caller_id,
					name: callData.caller_name,
					avatar: callData.caller_avatar
				}
			});

			groupCallState.showPreCallInterface(dataCall.channel_id, callData.is_video);
			groupCallState.autoJoinRoom(true, true);
			groupCallState.hideIncomingGroupCall();
		}
	};

	const handleCloseCall = async () => {
		if (callData && dataCall?.caller_id) {
			const quitData = createQuitData({
				isVideo: callData.is_video,
				groupId: dataCall.channel_id || '',
				callerId: userId,
				callerName: user?.user?.display_name || user?.user?.username || '',
				action: 'decline'
			}) as CallSignalingData;

			groupCallSignaling.sendGroupCallQuit([dataCall.caller_id], quitData, dataCall.channel_id ?? '', userId ?? '');
		}

		groupCallState.hideIncomingGroupCall();
		groupCallState.endGroupCall();
		groupCallAudio.playEndTone();
	};

	return (
		<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
			<div className="bg-black p-6 rounded-lg shadow-xl flex flex-col gap-6 items-center justify-center w-[300px]">
				<div className="text-center">
					<p className="font-semibold text-xl text-white">{groupName}</p>
					<p className="text-gray-400">{isVideoCall ? 'Incoming Video Call' : 'Incoming Voice Call'}</p>
				</div>

				<div className="flex items-center justify-center">
					<div className="w-16 h-16 relative">
						<AvatarImage
							className="w-16 h-16 rounded-full border-2 border-green-500"
							alt="caller avatar"
							username={user?.user?.display_name || user?.user?.username}
							srcImgProxy={createImgproxyUrl(user?.user?.avatar_url ?? '', {
								width: 300,
								height: 300,
								resizeType: 'fit'
							})}
							src={user?.user?.avatar_url}
						/>
						<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
							{isVideoCall ? <Icons.IconMeetDM className="w-4 h-4" /> : <Icons.IconPhoneDM defaultSize="size-5" />}
						</div>
					</div>
				</div>

				<div className="text-center">
					<p className="font-medium text-lg text-white">
						{user?.user?.display_name || user?.user?.username || 'Someone'} is inviting you to join
					</p>
					{memberCount > 1 && <p className="text-gray-400 mt-1">{memberCount} members in this group</p>}
				</div>

				<div className="flex gap-6 items-center">
					<button
						onClick={handleCloseCall}
						className="h-[56px] w-[56px] rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center cursor-pointer transition-colors"
					>
						<Icons.CloseButton className="w-[20px]" />
					</button>
					<button
						className="h-[56px] w-[56px] rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center cursor-pointer transition-colors"
						onClick={handleJoinCall}
					>
						{isVideoCall ? <Icons.IconMeetDM defaultSize="size-5" /> : <Icons.IconPhoneDM defaultSize="size-5" />}
					</button>
				</div>
			</div>
		</div>
	);
};

export default GroupPopupNotiCall;
