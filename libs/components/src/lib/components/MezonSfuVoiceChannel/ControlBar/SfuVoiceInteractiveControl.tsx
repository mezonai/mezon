import { selectAppInteractData, selectVoiceInfo } from '@mezon/store';
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

	const interactAppData = useSelector(selectAppInteractData);
	const iconClassName = `cursor-pointer ${interactAppData ? 'text-green-400' : 'text-[var(--bg-icon-theme)] hover:text-[var(--bg-icon-theme-active)]'} `;

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
			<div className={`flex items-center justify-center p-1 rounded-full ${interactAppData && 'shadow-[0px_0px_2px_#4ade80]'}`}>
				<Icons.Joystick className={iconClassName} />
			</div>
		</Tooltip>
	);
};
