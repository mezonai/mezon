import { MezonIcon, MzIcons24 } from '@mezon/ui';

interface IMicButtonProps {
	isTalking: boolean;
	onClick?: () => void;
}

export function MicButton({ isTalking, onClick }: IMicButtonProps) {
	return (
		<div className="relative leading-5 h-6">
			<button
				title={isTalking ? 'Mic Enabled' : 'Mic Disabled'}
				onClick={onClick}
				className="focus-visible:outline-none"
				onContextMenu={(e) => e.preventDefault()}
			>
				{isTalking ? (
					<MezonIcon icon={MzIcons24.mzMic} className="dark:hover:text-white hover:text-black text-[var(--mz-icon)]" />
				) : (
					<MezonIcon icon={MzIcons24.mzMicOff} className="text-red-600" />
				)}
			</button>
		</div>
	);
}
