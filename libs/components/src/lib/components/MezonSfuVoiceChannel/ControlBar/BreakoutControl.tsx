import { usePermissionChecker } from '@mezon/core';
import type { RootState } from '@mezon/store';
import {
	selectBreakoutPending,
	selectBreakoutRoom,
	selectHostedBreakoutByChannelId,
	selectVoiceInfo,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface BreakoutControlProps {
	isExternalCalling?: boolean;
	isOpen?: boolean;
	onToggleModal: () => void;
}

export const BreakoutControl = memo(({ isExternalCalling, isOpen = false, onToggleModal }: BreakoutControlProps) => {
	const { t } = useTranslation('channelVoice');
	const dispatch = useAppDispatch();
	const [hasManageClanPermission] = usePermissionChecker([EPermission.manageClan]);
	const voiceInfo = useSelector(selectVoiceInfo);
	const breakoutRoom = useSelector(selectBreakoutRoom);
	const breakoutPending = useSelector(selectBreakoutPending);
	const hostedBreakout = useSelector((state: RootState) => selectHostedBreakoutByChannelId(state, voiceInfo?.channelId || ''));

	if (isExternalCalling) {
		return null;
	}

	const isInBreakoutRoom = Boolean(breakoutRoom && voiceInfo?.channelId === breakoutRoom.roomId);

	if (isInBreakoutRoom) {
		const returnTooltip = t('breakout.returnToMain');
		return (
			<button
				id="voice-breakout-return-btn"
				type="button"
				disabled={breakoutPending}
				onClick={() => void dispatch(voiceActions.returnToMainRoom())}
				aria-label={returnTooltip}
				title={returnTooltip}
				className={`${SFU_CONTROL_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
			>
				<Icons.ArrowLeftCircle className="h-6 w-6 text-white max-lg:h-5 max-lg:w-5" />
			</button>
		);
	}

	if (!hasManageClanPermission) {
		return null;
	}

	const isHostingActive = Boolean(hostedBreakout && hostedBreakout.roomIds.length > 0);
	const highlighted = isOpen || isHostingActive;
	const tooltip = isHostingActive ? t('breakout.close') : t('breakout.title');

	return (
		<button
			id="voice-breakout-btn"
			type="button"
			onClick={onToggleModal}
			aria-label={tooltip}
			title={tooltip}
			className={`${SFU_CONTROL_BUTTON_CLASS} ${highlighted ? '!bg-[#5865f2] hover:!bg-[#4752c4]' : ''}`}
		>
			<Icons.VoiceBreakoutIcon className="h-6 w-6 text-white max-lg:h-5 max-lg:w-5" />
		</button>
	);
});
