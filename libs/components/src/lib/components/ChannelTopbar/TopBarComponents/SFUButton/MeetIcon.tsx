import { Icons } from '@mezon/ui';

interface IMeetButtonProps {
	isMeeting: boolean;
}

export function MeetButton({ isMeeting }: IMeetButtonProps) {
	return (
		<div className="relative leading-5 h-6">
			<button className="focus-visible:outline-none" onContextMenu={(e) => e.preventDefault()}>
				{isMeeting ? (
					<Icons.MeetEnable className="size-6 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
				) : (
					<Icons.MeetDisable className="size-6 text-red-600" />
				)}
			</button>
		</div>
	);
}
