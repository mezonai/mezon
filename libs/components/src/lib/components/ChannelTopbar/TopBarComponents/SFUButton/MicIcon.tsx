import { Icons } from '@mezon/ui';

interface IMicButtonProps {
	isTalking: boolean;
}

export function MicButton({ isTalking }: IMicButtonProps) {
	return (
		<div className="relative leading-5 h-6">
			<button className="focus-visible:outline-none" onContextMenu={(e) => e.preventDefault()}>
				{isTalking ? (
					<Icons.MicEnable className="size-6 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
				) : (
					<Icons.MicDisable className="size-6 text-red-600" />
				)}
			</button>
		</div>
	);
}
