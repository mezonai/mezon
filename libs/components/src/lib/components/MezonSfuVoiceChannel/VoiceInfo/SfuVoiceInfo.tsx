import { useAppNavigation } from '@mezon/core';
import {
	selectNoiseSuppressionEnabled,
	selectShowCamera,
	selectShowMicrophone,
	selectShowScreen,
	selectVoiceInfo,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId, useMediaPermissions } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import type { ReactNode } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ButtonCopy } from '../../../components';

const SfuVoiceInfo = React.memo(() => {
	const { t } = useTranslation('channelVoice');
	const dispatch = useAppDispatch();
	const { toChannelPage, navigate } = useAppNavigation();

	const currentVoiceInfo = useSelector(selectVoiceInfo);
	const isAudience = currentVoiceInfo?.joinRole === 'audience';
	const [pushToTalkActive, setPushToTalkActive] = useState(false);

	const redirectToVoice = () => {
		if (currentVoiceInfo) {
			const channelUrl = toChannelPage(currentVoiceInfo.channelId as string, currentVoiceInfo.clanId as string);
			navigate(channelUrl);
		}
	};

	const leaveVoice = async () => {
		const leaveButton = document.getElementById('btn-meet-leave');
		if (leaveButton) {
			leaveButton.click();
			return;
		}
		if (currentVoiceInfo) {
			dispatch(voiceActions.resetVoiceControl());
		}
	};

	const voiceAddress = `${currentVoiceInfo?.channelLabel} / ${currentVoiceInfo?.clanName}`;

	const showScreen = useSelector(selectShowScreen);
	const showCamera = useSelector(selectShowCamera);
	const showMicrophone = useSelector(selectShowMicrophone);

	const { hasCameraAccess, hasMicrophoneAccess, microphonePermissionState, cameraPermissionState } = useMediaPermissions();
	const handleToggleShareScreen = useCallback(() => {
		const btnControl = document.getElementById('btn-meet-screen');
		if (btnControl) {
			btnControl.click();
		} else {
			dispatch(voiceActions.setShowScreen(!showScreen));
		}
	}, [showScreen, dispatch]);

	const handleToggleShareCamera = useCallback(() => {
		const btnControl = document.getElementById('btn-meet-camera');
		btnControl?.click();
	}, []);

	const handleToggleOpenMicro = useCallback(() => {
		const btnControl = document.getElementById('btn-meet-micro');
		btnControl?.click();
	}, []);

	const setPushToTalk = useCallback((active: boolean) => {
		setPushToTalkActive(active);
		window.dispatchEvent(new CustomEvent('mezon-sfu-push-to-talk', { detail: { active } }));
	}, []);

	useEffect(() => {
		const handlePushToTalkChanged = (event: Event) => {
			const { active } = (event as CustomEvent<{ active?: boolean }>).detail || {};
			if (typeof active === 'boolean') setPushToTalkActive(active);
		};

		window.addEventListener('mezon-sfu-push-to-talk-changed', handlePushToTalkChanged);
		return () => window.removeEventListener('mezon-sfu-push-to-talk-changed', handlePushToTalkChanged);
	}, []);

	const linkVoice = useMemo(() => {
		if (currentVoiceInfo) {
			return `${process.env.NX_DOMAIN_URL}/chat/clans/${currentVoiceInfo.clanId}/channels/${currentVoiceInfo.channelId}`;
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
						<Icons.NetworkStatus className="w-4 h-4 dark:text-green-600" />
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
			<div className="flex items-center gap-4 justify-between">
				{isAudience && (
					<ButtonControlVoice
						active={pushToTalkActive}
						overlay={<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">Push to talk</span>}
						onPointerDown={(event) => {
							const btnControl = document.getElementById('btn-meet-push-to-talk');
							if (btnControl) {
								btnControl.dispatchEvent(new PointerEvent('pointerdown', { pointerId: event.pointerId, bubbles: true }));
							}
							event.currentTarget.setPointerCapture(event.pointerId);
							setPushToTalk(true);
						}}
						onPointerUp={() => setPushToTalk(false)}
						onPointerCancel={() => setPushToTalk(false)}
						onLostPointerCapture={() => setPushToTalk(false)}
						icon={<Icons.InPttCall className="w-5 h-5" />}
						showWarning={microphonePermissionState === 'denied' || hasMicrophoneAccess === false}
					/>
				)}

				{!isAudience && (
					<ButtonControlVoice
						overlay={
							<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">
								{t(showMicrophone ? 'turnOffMicrophone' : 'turnOnMicrophone')}
							</span>
						}
						onClick={handleToggleOpenMicro}
						icon={showMicrophone ? <Icons.VoiceMicIcon className="w-5 h-5" /> : <Icons.VoiceMicDisabledIcon className="w-5 h-5" />}
						showWarning={microphonePermissionState === 'denied' || hasMicrophoneAccess === false}
					/>
				)}

				{!isAudience && (
					<ButtonControlVoice
						overlay={<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">{t(showCamera ? 'turnOffCamera' : 'turnOnCamera')}</span>}
						onClick={handleToggleShareCamera}
						icon={showCamera ? <Icons.VoiceCameraIcon className="w-6 h-6" /> : <Icons.VoiceCameraDisabledIcon className="w-6 h-6" />}
						showWarning={cameraPermissionState === 'denied' || hasCameraAccess === false}
					/>
				)}

				{!isAudience && (
					<ButtonControlVoice
						overlay={
							<span className="bg-[#2B2B2B] p-[6px] text-[14px] rounded">{t(showScreen ? 'stopScreenShare' : 'shareYourScreen')}</span>
						}
						onClick={handleToggleShareScreen}
						icon={
							showScreen ? <Icons.VoiceScreenShareStopIcon className="w-5 h-5 " /> : <Icons.VoiceScreenShareIcon className="w-5 h-5 " />
						}
					/>
				)}
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
	onClick?: () => void;
	onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
	onPointerUp?: React.PointerEventHandler<HTMLButtonElement>;
	onPointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
	onLostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
	overlay: ReactNode;
	danger?: boolean;
	active?: boolean;
	icon: ReactNode;
	showWarning?: boolean;
}

const TOOLTIP_OVERLAY_STYLE = { background: 'none', boxShadow: 'none' };

const ButtonControlVoice = memo(
	({
		onClick,
		onPointerDown,
		onPointerUp,
		onPointerCancel,
		onLostPointerCapture,
		overlay,
		danger = false,
		active = false,
		icon,
		showWarning = false
	}: ButtonControlVoiceProps) => {
		return (
			<div className="flex-1 relative">
				<Tooltip
					showArrow={{ className: '!bottom-1' }}
					placement="top"
					overlay={overlay}
					overlayInnerStyle={TOOLTIP_OVERLAY_STYLE}
					overlayClassName="whitespace-nowrap z-50 !p-0 !pt-5"
					destroyTooltipOnHide
				>
					<button
						className={`flex h-9 w-full justify-center items-center ${
							danger ? 'bg-[#da373c]' : active ? 'bg-green-600' : 'bg-buttonSecondary hover:bg-buttonSecondaryHover'
						} p-[6px] rounded-md`}
						onClick={onClick}
						onPointerDown={onPointerDown}
						onPointerUp={onPointerUp}
						onPointerCancel={onPointerCancel}
						onLostPointerCapture={onLostPointerCapture}
						data-e2e={generateE2eId('modal.voice_management.button.control_item')}
					>
						{icon}
					</button>
				</Tooltip>
				{showWarning && (
					<div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
						<span className="text-black text-[10px] font-bold">!</span>
					</div>
				)}
			</div>
		);
	}
);

const ButtonNoiseControl = memo(() => {
	const dispatch = useAppDispatch();

	const noiseSuppressionEnabled = useSelector(selectNoiseSuppressionEnabled);
	const toggleNoiseSuppression = useCallback(() => {
		dispatch(voiceActions.setNoiseSuppressionEnabled(!noiseSuppressionEnabled));
	}, [dispatch, noiseSuppressionEnabled]);
	if (!noiseSuppressionEnabled) {
		return (
			<button
				onClick={toggleNoiseSuppression}
				className="flex items-center rounded-sm bg-item-theme-hover text-red-500 gap-2 p-[2px] text-sm bg-transparent bg-item-theme-hover"
			>
				<Icons.NoiseSupressionIcon className={`w-5 h-5`} disabled />
			</button>
		);
	}

	return (
		<Tooltip
			placement="top"
			overlay="Noise Suppression"
			overlayInnerStyle={TOOLTIP_OVERLAY_STYLE}
			overlayClassName="whitespace-nowrap z-50 !p-0 !pt-5"
			destroyTooltipOnHide
		>
			<button
				onClick={toggleNoiseSuppression}
				className="flex items-center rounded-sm bg-bgSecondary bg-item-theme-hover text-theme-primary gap-2 p-[2px] text-sm bg-transparent bg-item-theme-hover"
			>
				<Icons.NoiseSupressionIcon className={`w-5 h-5 text-theme-primary-active`} />
			</button>
		</Tooltip>
	);
});

export default SfuVoiceInfo;
