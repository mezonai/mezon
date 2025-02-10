import { Icons } from '@mezon/ui';

interface IStartCallButtonProps {
	isJoinVoice: boolean;
	loading: boolean;
	onClick?: () => void;
}

export function StartCallButton({ loading, isJoinVoice, onClick }: IStartCallButtonProps) {
	return (
		<div className="relative leading-5 h-6">
			<button
				title={!isJoinVoice ? 'Click To Join Call' : loading ? 'loading' : 'Click To Stop Call'}
				onClick={onClick}
				className="focus-visible:outline-none"
				onContextMenu={(e) => e.preventDefault()}
			>
				{isJoinVoice ? (
					<Icons.StartCall className="size-6 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
				) : (
					<Icons.StopCall className="size-6 text-red-600" />
				)}
			</button>
		</div>
	);
}
