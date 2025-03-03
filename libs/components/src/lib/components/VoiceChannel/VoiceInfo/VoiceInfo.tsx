import { useAppNavigation, useAuth } from '@mezon/core';
import {
	handleParticipantMeetState,
	selectShowCamera,
	selectShowMicrophone,
	selectShowScreen,
	selectTheme,
	selectVoiceInfo,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ParticipantMeetState } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
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

	const showScreen = useSelector(selectShowScreen);
	const showCamera = useSelector(selectShowCamera);
	const showMicrophone = useSelector(selectShowMicrophone);

	return (
		<div
			className={`flex flex-col gap-2 border-b-2 dark:border-borderDefault border-gray-300 px-4 py-2 hover:bg-gray-550/[0.16] shadow-sm transition
			${isLightMode ? 'bg-channelTextareaLight lightMode' : 'dark:bg-bgSecondary600'} w-full group`}
		>
			<div className="flex justify-between items-center">
				<div className="flex flex-col max-w-[200px]">
					<div className="flex items-center gap-1">
						<Icons.NetworkStatus defaultSize="w-4 h-4 dark:text-green-600" />
						<span className="text-green-600 font-medium text-base">{showCamera ? 'Video' : 'Voice'} Connected</span>
					</div>
					<button className="w-fit" onClick={redirectToVoice}>
						<div className="hover:underline font-medium text-xs dark:text-contentSecondary text-colorTextLightMode">
							{voiceAddress.length > 30 ? `${voiceAddress.substring(0, 30)}...` : voiceAddress}
						</div>
					</button>
				</div>
			</div>
			<div className="grid grid-cols-4 gap-4">
				<Tooltip
					placement="top"
					overlay={
						<span className="bg-[#2B2B2B] p-2 !text-[16px] rounded">{showMicrophone ? 'Turn Off Microphone' : 'Turn On Microphone'}</span>
					}
					overlayClassName="whitespace-nowrap z-50 !p-0 !pt-5"
					destroyTooltipOnHide
				>
					<button
						className="flex justify-center items-center bg-buttonSecondary hover:bg-buttonSecondaryHover p-[6px] rounded-md"
						onClick={() => dispatch(voiceActions.setShowMicrophone(!showMicrophone))}
					>
						{showMicrophone ? <Icons.VoiceMicIcon className="w-4 h-4" /> : <Icons.VoiceMicDisabledIcon className="w-4 h-4" />}
					</button>
				</Tooltip>
				<Tooltip
					placement="top"
					overlay={<span className="bg-[#2B2B2B] p-2 !text-[16px] rounded">{showCamera ? 'Turn Off Camera' : 'Turn On Camera'}</span>}
					overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
					destroyTooltipOnHide
				>
					<button
						className="flex justify-center items-center bg-buttonSecondary hover:bg-buttonSecondaryHover p-[6px] rounded-md"
						onClick={() => dispatch(voiceActions.setShowCamera(!showCamera))}
					>
						{showCamera ? <Icons.VoiceCameraIcon className="w-4 h-4" /> : <Icons.VoiceCameraDisabledIcon className="w-4 h-4" />}
					</button>
				</Tooltip>
				<Tooltip
					placement="top"
					overlay={<span className="bg-[#2B2B2B] p-2 !text-[16px] rounded">{showScreen ? 'Stop screen share' : 'Share Your Screen'}</span>}
					overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
					destroyTooltipOnHide
				>
					<button
						className="flex justify-center items-center bg-buttonSecondary hover:bg-buttonSecondaryHover p-[6px] rounded-md"
						onClick={() => dispatch(voiceActions.setShowScreen(!showScreen))}
					>
						{showScreen ? <Icons.VoiceScreenShareStopIcon className="w-5 h-5" /> : <Icons.VoiceScreenShareIcon className="w-5 h-5" />}
					</button>
				</Tooltip>
				<Tooltip
					placement="top"
					overlay={<span className="bg-[#2B2B2B] p-2 !text-[16px] rounded">Disconnect</span>}
					overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
					destroyTooltipOnHide
				>
					<button className="flex justify-center items-center bg-[#da373c] hover:bg-[#a12829] p-[6px] rounded-md" onClick={leaveVoice}>
						<Icons.EndCall className="w-5 h-5" />
					</button>
				</Tooltip>
			</div>
		</div>
	);
});

export default VoiceInfo;
