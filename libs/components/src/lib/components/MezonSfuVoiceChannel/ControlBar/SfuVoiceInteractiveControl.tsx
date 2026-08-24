import { selectVoiceInfo } from '@mezon/store';
import { Icons } from '@mezon/ui';
import Tooltip from 'rc-tooltip';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { SfuVoiceInteractiveMenu } from '../VoiceInteractive/SfuVoiceInteractiveMenu';

interface SfuVoiceInteractiveControlProps {
	showVoiceInteractive: boolean;
	onVisibleChange: (visible: boolean) => void;
}

export const SfuVoiceInteractiveControl = ({ showVoiceInteractive, onVisibleChange }: SfuVoiceInteractiveControlProps) => {
	const handleClose = useCallback(() => {
		onVisibleChange(false);
	}, [onVisibleChange]);

	const iconClassName = 'cursor-pointer text-[var(--bg-icon-theme)] hover:text-[var(--bg-icon-theme-active)]';

	const voiceInfo = useSelector(selectVoiceInfo);
	const channelId = voiceInfo?.channelId ?? '';

	return (
		<Tooltip
			placement="topLeft"
			trigger={['click']}
			overlayClassName="w-auto text-theme-primary"
			visible={showVoiceInteractive}
			onVisibleChange={onVisibleChange}
			overlay={<SfuVoiceInteractiveMenu channelId={channelId} onClose={handleClose} />}
			destroyTooltipOnHide
		>
			<div>
				<Icons.Joystick className={iconClassName} />
			</div>
		</Tooltip>
	);
};
