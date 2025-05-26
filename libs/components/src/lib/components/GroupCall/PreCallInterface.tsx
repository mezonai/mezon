import { audioCallActions, selectDmGroupCurrent, selectIsVideoGroupCall, useAppDispatch } from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CallControls } from './components/CallControls';
import { CallStatus } from './components/CallStatus';

type PreCallInterfaceProps = {
	onJoinCall: (isVideoCall: boolean) => void;
	onCancel: () => void;
	loading: boolean;
	directId: string;
};

const PreCallInterface = memo(({ onJoinCall, onCancel, loading, directId }: PreCallInterfaceProps) => {
	const currentDmGroup = useSelector(selectDmGroupCurrent(directId ?? ''));
	const dispatch = useAppDispatch();
	const avatarImages = currentDmGroup?.channel_avatar || [];
	const isDmGroup = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP;
	const isDm = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM;
	const isVideoCall = useSelector(selectIsVideoGroupCall);
	const [isConnecting, setIsConnecting] = useState(false);

	useEffect(() => {
		dispatch(audioCallActions.setIsDialTone(true));
		dispatch(audioCallActions.setIsRingTone(false));
		dispatch(audioCallActions.setIsBusyTone(false));
		dispatch(audioCallActions.setIsEndTone(false));

		return () => {
			dispatch(audioCallActions.setIsDialTone(false));
		};
	}, [dispatch]);

	useEffect(() => {
		if (!loading && !isConnecting) {
			setIsConnecting(true);
			onJoinCall(isVideoCall);
		}
	}, [onJoinCall, loading, isVideoCall, isConnecting]);

	const handleCancel = () => {
		dispatch(audioCallActions.setIsDialTone(false));
		onCancel();
	};

	const handleJoin = () => {
		onJoinCall(isVideoCall);
	};

	if (!isDmGroup && !isDm) return null;

	const groupName = currentDmGroup?.channel_label || currentDmGroup?.usernames?.join(',') || 'Group Call';
	const groupAvatar = avatarImages?.[0];

	return (
		<div className="flex flex-col w-full h-full bg-black/95 items-center justify-center text-white p-4">
			<div className="flex flex-col items-center gap-6 max-w-md w-full">
				{/* Call type indicator */}
				{/* <div className="flex items-center gap-2 text-xl bg-gray-800/60 px-4 py-2 rounded-full animate-pulse">
					{isVideoCall ? <Icons.IconMeetDM className="h-5 w-5" /> : <Icons.IconPhoneDM className="h-5 w-5" />}
					<span className="font-medium">{isVideoCall ? 'Starting video call' : 'Starting voice call'}</span>
				</div> */}

				<CallStatus
					isConnecting={isConnecting || loading}
					isConnected={false}
					participantCount={currentDmGroup?.user_id?.length || 0}
					groupName={groupName}
					groupAvatar={groupAvatar}
				/>

				<CallControls onCancel={handleCancel} loading={loading} isVideo={isVideoCall} />

				{isDmGroup && (
					<div className="text-center text-gray-400">
						<p>{currentDmGroup?.user_id?.length || 0} members will be notified</p>
					</div>
				)}
			</div>
		</div>
	);
});

export default PreCallInterface;
