import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { ChannelStreamMode } from 'mezon-js';
import Tooltip from 'rc-tooltip';
import { memo, useCallback } from 'react';
import SoundSquare from '../../GifsStickersEmojis/SoundSquare';

interface SoundReactionControlProps {
	isGridView?: boolean;
	isShowMember?: boolean;
	showSoundPanel: boolean;
	onVisibleChange: (visible: boolean) => void;
	onSoundSelect: (soundId: string, soundUrl: string) => void;
}

export const SoundReactionControl = memo(({ showSoundPanel, onVisibleChange, onSoundSelect }: SoundReactionControlProps) => {
	const handleClose = useCallback(() => {
		onVisibleChange(false);
	}, [onVisibleChange]);

	const handleSoundSelect = useCallback(
		(soundId: string, soundUrl: string) => {
			onSoundSelect(soundId, soundUrl);
		},
		[onSoundSelect]
	);

	const iconClassName = 'cursor-pointer text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)]';

	return (
		<Tooltip
			placement="topLeft"
			trigger={['click']}
			overlayClassName="w-auto text-theme-primary"
			visible={showSoundPanel}
			onVisibleChange={onVisibleChange}
			overlay={<SoundSquare mode={ChannelStreamMode.STREAM_MODE_CHANNEL} onClose={handleClose} onSoundSelect={handleSoundSelect} />}
			destroyTooltipOnHide
		>
			<div>
				<MezonIcon icon={MzIcons20.mzSoundboard} className={iconClassName} />
			</div>
		</Tooltip>
	);
});

SoundReactionControl.displayName = 'SfuSoundReactionControl';
