import { useAppNavigation, useAuth } from '@mezon/core';
import {
	handleParticipantVoiceState,
	selectDmGroupCurrent,
	selectIsGroupCallActive,
	selectNoiseSuppressionEnabled,
	selectNoiseSuppressionLevel,
	selectShowCamera,
	selectShowMicrophone,
	selectShowScreen,
	selectVoiceInfo,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ParticipantMeetState, generateE2eId, useMediaPermissions } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelType } from 'mezon-js';
import Tooltip from 'rc-tooltip';
import type { ReactNode } from 'react';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ButtonCopy } from '../../../components';
import { useGroupCallSignaling, useGroupCallState } from '../../GroupCall';

const VoiceInfo = React.memo(() => {
	const { t } = useTranslation('channelVoice');
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const { toChannelPage, toDmGroupPage, navigate } = useAppNavigation();

	const currentVoiceInfo = useSelector(selectVoiceInfo);
	const isGroupCallActive = useSelector(selectIsGroupCallActive);

	const currentDmGroup = useSelector(selectDmGroupCurrent(currentVoiceInfo?.channelId || ''));

	const groupCallState = useGroupCallState();
	const groupCallSignaling = useGroupCallSignaling();

	const redirectToVoice = () => {
		if (currentVoiceInfo) {
			const isGroupCall = currentVoiceInfo.clanId === '0' || isGroupCallActive;

			if (isGroupCall) {
				const groupUrl = toDmGroupPage(currentVoiceInfo.channelId as string, ChannelType.CHANNEL_TYPE_GROUP);
				navigate(groupUrl);
			} else {
				const channelUrl = toChannelPage(currentVoiceInfo.channelId as string, currentVoiceInfo.clanId as string);
				navigate(channelUrl);
			}
		}
	};

	const participantMeetState = async (state: ParticipantMeetState, clanId: string, channelId: string, roomId: string): Promise<void> => {
		await dispatch(
			handleParticipantVoiceState({
				clan_id: clanId,
				channel_id: channelId,
				display_name: userProfile?.user?.display_name ?? '',
				state,
				room_name: state === ParticipantMeetState.LEAVE ? 'leave' : roomId || ''
			})
		);
	};

	const leaveVoice = async () => {
		if (currentVoiceInfo) {
			const isGroupCall = currentVoiceInfo.clanId === '0' || isGroupCallActive;

			if (isGroupCall) {
				groupCallState.endGroupCall();

				if (currentDmGroup?.user_ids && userProfile?.user?.id) {
					const participantLeftData = {
						userId: userProfile.user.id,
						userName: userProfile.user.display_name || userProfile.user.username,
						timestamp: Date.now()
					};

					groupCallSignaling.sendParticipantLeft(
						currentDmGroup.user_ids,
						participantLeftData,
						currentVoiceInfo.channelId,
						userProfile.user.id
					);
				}

				dispatch(voiceActions.setJoined(false));
				dispatch(voiceActions.setToken(''));
			} else {
				dispatch(voiceActions.resetVoiceControl());
			}
			await participantMeetState(
				ParticipantMeetState.LEAVE,
				currentVoiceInfo.clanId,
				currentVoiceInfo.channelId,
				currentVoiceInfo.roomId || ''
			);
		}
	};

	const voiceAddress = `${currentVoiceInfo?.channelLabel} / ${currentVoiceInfo?.clanName}`;

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
		const btnControl = document.getElementById('btn-meet-camera');
		if (!btnControl) {
			return;
		}
		const enable = btnControl.dataset.lkEnabled?.toLowerCase() === 'true';
		btnControl?.click();
		dispatch(voiceActions.setShowCamera(!enable));
	}, []);

	const handleToggleOpenMicro = useCallback(() => {
		const btnControl = document.getElementById('btn-meet-micro');
		if (!btnControl) {
			return;
		}
		const enable = btnControl.dataset.lkEnabled?.toLowerCase() === 'true';
		btnControl?.click();
		dispatch(voiceActions.setShowMicrophone(!enable));
	}, []);

	const linkVoice = useMemo(() => {
		if (currentVoiceInfo) {
			const isGroupCall = currentVoiceInfo.clanId === '0' || isGroupCallActive;

			return isGroupCall
				? `${process.env.NX_DOMAIN_URL}/chat/direct/message/${currentVoiceInfo.channelId}/${ChannelType.CHANNEL_TYPE_GROUP}`
				: `${process.env.NX_DOMAIN_URL}/chat/clans/${currentVoiceInfo.clanId}/channels/${currentVoiceInfo.channelId}`;
		}
	}, [currentVoiceInfo]);
	return (
		<div
			className={`flex flex-col gap-2 rounded-t-lg border-b-2 border-theme-primary px-4 py-2 hover:bg-gray-550/[0.16] shadow-sm transition bg-theme-chat w-full group`}
			data-e2e={generateE2eId('modal.voice_management')}
		>
			<div className="flex justify-between items-center">
				<div className="flex flex-col max-w-[200px]">
					<div className="flex items-center gap-1">
						<Icons.NetworkStatus defaultSize="w-4 h-4 dark:text-green-600" />
						<span className="text-green-600 font-medium text-base">{t(showCamera ? 'videoConnected' : 'voiceConnected')}</span>
					</div>
					<button className="w-fit" onClick={redirectToVoice}>
						<div className="hover:underline font-medium text-xs text-theme-primary">
							{voiceAddress.length > 30 ? `${voiceAddress.substring(0, 30)}...` : voiceAddress}
						</div>
					</button>
				</div>
				<div className="flex items-center gap-2">
					<ButtonNoiseControl />
					<ButtonCopy copyText={linkVoice} key={linkVoice} />
				</div>
			</div>
			<div className="flex items-centerg gap-4 justify-between">
				{hasMicrophoneAccess && (
					<ButtonControlVoice
						overlay={
							hasMicrophoneAccess ? (
								<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">
									{t(showMicrophone ? 'turnOffMicrophone' : 'turnOnMicrophone')}
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
								<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">{t(showCamera ? 'turnOffCamera' : 'turnOnCamera')}</span>
							) : null
						}
						onClick={handleToggleShareCamera}
						icon={showCamera ? <Icons.VoiceCameraIcon className="w-4 h-4" /> : <Icons.VoiceCameraDisabledIcon className="w-4 h-4" />}
					/>
				)}

				<ButtonControlVoice
					overlay={
						<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">{t(showScreen ? 'stopScreenShare' : 'shareYourScreen')}</span>
					}
					onClick={handleToggleShareScreen}
					icon={showScreen ? <Icons.VoiceScreenShareStopIcon className="w-5 h-5" /> : <Icons.VoiceScreenShareIcon className="w-5 h-5" />}
				/>
				<ButtonControlVoice
					danger={true}
					overlay={<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">{t('disconnect')}</span>}
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

const TOOLTIP_OVERLAY_STYLE = { background: 'none', boxShadow: 'none' };

const ButtonControlVoice = memo(({ onClick, overlay, danger = false, icon }: ButtonControlVoiceProps) => {
	return (
		<Tooltip
			showArrow={{ className: '!bottom-1' }}
			placement="top"
			overlay={overlay}
			overlayInnerStyle={TOOLTIP_OVERLAY_STYLE}
			overlayClassName="whitespace-nowrap z-50 !p-0 !pt-5"
			destroyTooltipOnHide
		>
			<button
				className={`flex h-8 flex-1 justify-center items-center ${danger ? 'bg-[#da373c] hover:bg-[#a12829]' : 'bg-buttonSecondary hover:bg-buttonSecondaryHover'} p-[6px] rounded-md`}
				onClick={onClick}
				data-e2e={generateE2eId('modal.voice_management.button.control_item')}
			>
				{icon}
			</button>
		</Tooltip>
	);
});

const ButtonNoiseControl = memo(() => {
	const dispatch = useAppDispatch();

	const noiseSuppressionEnabled = useSelector(selectNoiseSuppressionEnabled);
	const toggleNoiseSuppression = useCallback(() => {
		dispatch(voiceActions.setNoiseSuppressionEnabled(!noiseSuppressionEnabled));
	}, [dispatch, noiseSuppressionEnabled]);
	const noiseSuppressionLevel = useSelector(selectNoiseSuppressionLevel);
	const handleNoiseSuppressionLevelChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			dispatch(voiceActions.setNoiseSuppressionLevel(Number(e.target.value)));
		},
		[dispatch]
	);

	if (!noiseSuppressionEnabled) {
		return (
			<button
				onClick={toggleNoiseSuppression}
				className="flex items-center rounded-sm bg-bgSecondary bg-item-theme-hover text-theme-primary gap-2 p-[2px] text-sm bg-transparent bg-item-theme-hover"
			>
				<Icons.NoiseSupressionIcon className={`w-5 h-5`}>
					<path d="M3 21 L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				</Icons.NoiseSupressionIcon>
			</button>
		);
	}

	return (
		<Tooltip
			placement="top"
			overlay={
				noiseSuppressionEnabled ? (
					<div className="p-2" onClick={(e) => e.stopPropagation()}>
						<div className="flex justify-between items-center mb-2">
							<span className="text-xs font-semibold">Noise Suppression</span>
							<span className="text-xs text-gray-400">{noiseSuppressionLevel}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={noiseSuppressionLevel}
							onChange={handleNoiseSuppressionLevelChange}
							className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
							disabled={!noiseSuppressionEnabled}
						/>
					</div>
				) : null
			}
			overlayInnerStyle={TOOLTIP_OVERLAY_STYLE}
			overlayClassName="whitespace-nowrap z-50 !p-0 !pt-5"
			destroyTooltipOnHide
		>
			<button
				onClick={toggleNoiseSuppression}
				className="flex items-center rounded-sm bg-bgSecondary bg-item-theme-hover text-theme-primary gap-2 p-[2px] text-sm bg-transparent bg-item-theme-hover"
			>
				<Icons.NoiseSupressionIcon className={`w-5 h-5 text-green-400`} />
			</button>
		</Tooltip>
	);
});

export default VoiceInfo;
