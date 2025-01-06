import { messagesActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import classNames from 'classnames';

type ChannelJumpProps = {
	clanId: string;
	channelId: string;
	className?: string;
};

export function ChannelJumpToPresent({ clanId, channelId, className }: ChannelJumpProps) {
	const dispatch = useAppDispatch();
	const handleJumpToPresent = () => {
		// Jump to present
		dispatch(messagesActions.setIsJumpingToPresent({ channelId: channelId, status: true }));
		dispatch(messagesActions.fetchMessages({ clanId, channelId, isFetchingLatestMessages: true, noCache: true }));
	};

	return (
		<div
			className={classNames('w-full h-full opacity-95 cursor-pointer text-white flex items-center justify-between', className)}
			onClick={handleJumpToPresent}
		>
			<div>You're viewing older messages</div>
			<div className="flex items-center gap-1">
				Jump to present
				<Icons.JumpToPresentArrow className="w-4 h-4 text-white" />
			</div>
		</div>
	);
}
