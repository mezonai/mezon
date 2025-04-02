import { Icons } from '@mezon/ui';
import type { ReactNode } from 'react';
import { memo } from 'react';

interface ControlButtonProps {
	onClick: () => void;
	isActive: boolean;
	label: string;
	icon: ReactNode;
	audioLevel?: number;
}

const ControlButton = memo(({ onClick, isActive, label, icon, audioLevel = 0 }: ControlButtonProps) => {
	return (
		<button onClick={onClick} className="flex flex-col items-center gap-2" aria-pressed={isActive} title={label}>
			<Icons.AudioLevelCircle audioLevel={audioLevel} isActive={isActive && audioLevel !== undefined}>
				<div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-indigo-600' : 'bg-zinc-700'}`}>{icon}</div>
			</Icons.AudioLevelCircle>

			<span className="text-sm text-gray-300">{label}</span>
		</button>
	);
});

export { ControlButton };
