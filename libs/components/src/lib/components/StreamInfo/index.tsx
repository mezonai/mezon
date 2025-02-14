import { useAppNavigation, useAuth, useMenu, useWebRTCCall } from '@mezon/core';
import {
	DMCallActions,
	audioCallActions,
	categoriesActions,
	directActions,
	selectCloseMenu,
	selectCurrentStreamInfo,
	selectDirectById,
	selectDmGroupCurrent,
	selectGroupCallId,
	selectJoinedCall,
	selectStreamMembersByChannelId,
	selectTheme,
	useAppDispatch,
	useAppSelector,
	usersStreamActions,
	videoStreamActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ESummaryInfo } from '@mezon/utils';
import { useSelector } from 'react-redux';
import { useWebRTCStream } from '../StreamContext/StreamContext';

interface StreamInfoProps {
	type?: string;
}

const StreamInfo = ({ type }: StreamInfoProps) => {
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const { toChannelPage, navigate } = useAppNavigation();
	const { setStatusMenu } = useMenu();

	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const appearanceTheme = useSelector(selectTheme);
	const closeMenu = useSelector(selectCloseMenu);
	const streamChannelMember = useAppSelector((state) => selectStreamMembersByChannelId(state, currentStreamInfo?.streamId || ''));
	const groupCallId = useSelector(selectGroupCallId);
	const currentDmGroup = useSelector(selectDmGroupCurrent(groupCallId ?? ''));
	const dmUserId = currentDmGroup?.user_id?.[0] || '';
	const direct = useAppSelector((state) => selectDirectById(state, groupCallId)) || {};
	const isJoinedCall = useSelector(selectJoinedCall);
	const { disconnect } = useWebRTCStream();

	const { handleEndCall, toggleAudio, toggleVideo } = useWebRTCCall(
		dmUserId,
		groupCallId as string,
		userProfile?.user?.id as string,
		userProfile?.user?.username as string,
		userProfile?.user?.avatar_url as string
	);
	const redirectToCall = async () => {
		await dispatch(
			directActions.joinDirectMessage({
				directMessageId: direct.id,
				channelName: '',
				type: direct.type
			})
		);
		navigate(`/chat/direct/message/${direct?.channel_id}/${direct?.type}`);
	};

	const redirectToStream = () => {
		if (currentStreamInfo) {
			const channelUrl = toChannelPage(currentStreamInfo.streamId, currentStreamInfo.clanId);
			dispatch(
				categoriesActions.setCtrlKFocusChannel({
					id: currentStreamInfo.streamId,
					parentId: currentStreamInfo.parentId
				})
			);
			navigate(channelUrl);
		}
	};

	const leaveChannel = async () => {
		if (type === ESummaryInfo.CALL) {
			await handleEndCall();
			dispatch(DMCallActions.setIsInCall(false));
			dispatch(DMCallActions.removeAll());
			muteSound();
			dispatch(audioCallActions.startDmCall({}));
			dispatch(audioCallActions.setUserCallId(''));
		} else if (type === ESummaryInfo.STREAM && currentStreamInfo) {
			disconnect();
			dispatch(videoStreamActions.stopStream());
			dispatch(videoStreamActions.setIsJoin(false));
			const userStreamId = streamChannelMember?.find((member) => member?.user_id === userProfile?.user?.id)?.id;
			dispatch(usersStreamActions.remove(userStreamId || ''));
		}
	};

	const muteSound = () => {
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsDialTone(false));
	};

	const handleClick = () => {
		if (closeMenu) setStatusMenu(false);
		type === ESummaryInfo.CALL ? redirectToCall() : redirectToStream();
	};

	// const streamAddress =
	// 	type === ESummaryInfo.CALL
	// 		? currentDmGroup?.usernames || ''
	// 		: type === ESummaryInfo.STREAM
	// 			? `${currentStreamInfo?.streamName} / ${currentStreamInfo?.clanName}`
	// 			: '';
	const streamAddress =
		type === ESummaryInfo.CALL
			? currentDmGroup?.usernames?.toString() || ''
			: type === ESummaryInfo.STREAM
				? `${currentStreamInfo?.streamName} / ${currentStreamInfo?.clanName}`
				: '';

	const isLightMode = appearanceTheme === 'light';

	return (
		<div
			className={`border-b dark:border-borderDefault border-gray-300 px-4 py-2 hover:bg-gray-550/[0.16] shadow-sm transition
			${isLightMode ? 'bg-channelTextareaLight lightMode' : 'dark:bg-bgSecondary600'} w-full group`}
		>
			<div className="flex justify-between items-center">
				<div className="flex flex-col max-w-[200px]">
					<div className="flex items-center gap-1">
						<Icons.NetworkStatus defaultSize="w-4 h-4 dark:text-channelTextLabel" />
						<span className="text-green-700 font-bold text-base">
							{type === ESummaryInfo.CALL ? `${isJoinedCall ? 'Call Connected' : 'Calling...'}` : 'Stream Connected'}
						</span>
					</div>
					<button className="w-fit" onClick={handleClick}>
						<div className="hover:underline font-medium text-xs dark:text-contentSecondary text-colorTextLightMode">
							{streamAddress.length > 30 ? `${streamAddress.substring(0, 30)}...` : streamAddress}
						</div>
					</button>
				</div>
				<button
					className="opacity-80 dark:text-[#AEAEAE] text-black dark:hover:bg-[#5e5e5e] hover:bg-bgLightModeButton p-1 rounded-md"
					onClick={leaveChannel}
				>
					<Icons.EndCall className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};

export default StreamInfo;
