import { useAppNavigation, useAuth } from '@mezon/core';
import {
	handleParticipantVoiceState,
	selectShowCamera,
	selectShowMicrophone,
	selectShowScreen,
	selectTheme,
	selectVoiceInfo,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ParticipantMeetState, useMediaPermissions } from '@mezon/utils';
import isElectron from 'is-electron';
import Tooltip from 'rc-tooltip';
import React, { ReactNode, memo, useCallback } from 'react';
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
			handleParticipantVoiceState({
				clan_id: clanId,
				channel_id: channelId,
				display_name: userProfile?.user?.display_name ?? '',
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

	const { hasCameraAccess, hasMicrophoneAccess } = useMediaPermissions();
	const handleToggleShareScreen = useCallback(() => {
		if (isElectron() && !showScreen) {
			dispatch(voiceActions.setShowSelectScreenModal(true));
			return;
		}
		dispatch(voiceActions.setShowScreen(!showScreen));
	}, [showScreen]);

	const handleToggleShareCamera = useCallback(() => {
		dispatch(voiceActions.setShowCamera(!showCamera));
	}, [showCamera]);

	const handleToggleOpenMicro = useCallback(() => {
		dispatch(voiceActions.setShowMicrophone(!showMicrophone));
	}, [showMicrophone]);

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
			<div className="flex items-centerg gap-4 justify-between">
				{hasMicrophoneAccess && (
					<ButtonControlVoice
						overlay={
							hasMicrophoneAccess ? (
								<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">
									{showMicrophone ? 'Turn Off Microphone' : 'Turn On Microphone'}
								</span>
							) : null
						}
						onClick={handleToggleOpenMicro}
						icon={showMicrophone ? <Icons.VoiceMicIcon className="w-4 h-4" /> : <Icons.VoiceMicDisabledIcon className="w-4 h-4" />}
					/>
				)}
				{hasCameraAccess && (
					<ButtonControlVoice
						overlay={
							hasCameraAccess ? (
								<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">{showCamera ? 'Turn Off Camera' : 'Turn On Camera'}</span>
							) : null
						}
						onClick={handleToggleShareCamera}
						icon={showCamera ? <Icons.VoiceCameraIcon className="w-4 h-4" /> : <Icons.VoiceCameraDisabledIcon className="w-4 h-4" />}
					/>
				)}

				<ButtonControlVoice
					overlay={
						<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">{showScreen ? 'Stop screen share' : 'Share Your Screen'}</span>
					}
					onClick={handleToggleShareScreen}
					icon={showScreen ? <Icons.VoiceScreenShareStopIcon className="w-5 h-5" /> : <Icons.VoiceScreenShareIcon className="w-5 h-5" />}
				/>
				<ButtonControlVoice
					danger={true}
					overlay={<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">Disconnect</span>}
					onClick={leaveVoice}
					icon={<Icons.EndCall className="w-5 h-5" />}
				/>
			</div>
		</div>
	);
});
interface ButtonControlVoiceProps {
	onClick: () => void;
	overlay: ReactNode;
	danger?: boolean;
	icon: ReactNode;
}
const ButtonControlVoice = memo(({ onClick, overlay, danger = false, icon }: ButtonControlVoiceProps) => {
	return (
		<Tooltip
			showArrow={{ className: '!bottom-1' }}
			placement="top"
			overlay={overlay}
			overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
			overlayClassName="whitespace-nowrap z-50 !p-0 !pt-5"
			destroyTooltipOnHide
		>
			<button
				className={`flex h-8 flex-1 justify-center items-center ${danger ? 'bg-[#da373c] hover:bg-[#a12829]' : 'bg-buttonSecondary hover:bg-buttonSecondaryHover'} p-[6px] rounded-md`}
				onClick={onClick}
			>
				{icon}
			</button>
		</Tooltip>
	);
});

export default VoiceInfo;
