import { MezonIcon, MzIcons24 } from '@mezon/ui';

interface IVideoButoonProps {
	isEnable: boolean;
	onClick?: () => void;
}
export function VideoButoon({ isEnable, onClick }: IVideoButoonProps) {
	return (
		<div className="relative leading-5 h-6">
			<button onClick={onClick} className="focus-visible:outline-none" onContextMenu={(e) => e.preventDefault()}>
				{isEnable ? (
					<MezonIcon icon={MzIcons24.mzVideo} className="dark:hover:text-white hover:text-black text-[var(--mz-icon)]" />
				) : (
					<MezonIcon icon={MzIcons24.mzVideoOff} className="text-red-600" />
				)}
			</button>
		</div>
	);
}
