import { useAppNavigation, useAuth } from '@mezon/core';
import { handleParticipantMeetState, selectTheme, selectVoiceInfo, useAppDispatch, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ParticipantMeetState } from '@mezon/utils';
import React from 'react';
import { useSelector } from 'react-redux';

const VoiceInfo = React.memo(() => {
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const { toChannelPage, navigate } = useAppNavigation();

	const appearanceTheme = useSelector(selectTheme);

	const currentVoiceInfo = useSelector(selectVoiceInfo);

	const redirectToVoice = () => {
		if (currentVoiceInfo) {
			const channelUrl = toChannelPage(currentVoiceInfo.channelId as string, currentVoiceInfo.clanId as string);
			navigate(channelUrl);
		}
	};

	const participantMeetState = async (state: ParticipantMeetState, clanId: string, channelId: string): Promise<void> => {
		await dispatch(
			handleParticipantMeetState({
				clan_id: clanId,
				channel_id: channelId,
				user_id: userProfile?.user?.id,
				display_name: userProfile?.user?.display_name,
				state
			})
		);
	};

	const leaveVoice = async () => {
		dispatch(voiceActions.resetVoiceSettings());
		await participantMeetState(ParticipantMeetState.LEAVE, currentVoiceInfo?.clanId as string, currentVoiceInfo?.channelId as string);
	};

	const voiceAddress = `${currentVoiceInfo?.channelLabel} / ${currentVoiceInfo?.clanName}`;

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
						<span className="text-green-700 font-bold text-base">Voice Connected</span>
					</div>
					<button className="w-fit" onClick={redirectToVoice}>
						<div className="hover:underline font-medium text-xs dark:text-contentSecondary text-colorTextLightMode">
							{voiceAddress.length > 30 ? `${voiceAddress.substring(0, 30)}...` : voiceAddress}
						</div>
					</button>
				</div>
				<button
					className="opacity-80 dark:text-[#AEAEAE] text-black dark:hover:bg-[#5e5e5e] hover:bg-bgLightModeButton p-1 rounded-md"
					onClick={leaveVoice}
				>
					<Icons.EndCall className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
});

export default VoiceInfo;
