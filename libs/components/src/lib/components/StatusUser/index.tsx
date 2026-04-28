import { Icons } from '@mezon/ui';

export const RenderTypingIndicator = () => (
	<Icons.IconLoadingTyping bgFill="bg-colorSuccess" className="shrink-0" width={18} height={8} />
);

type Status = 'online' | 'idle' | 'dnd' | 'offline';

const statusColors: Record<Status, string> = {
	online: 'bg-green-500',
	idle: 'bg-yellow-500',
	dnd: 'bg-red-500',
	offline: 'bg-gray-400'
};

export const StatusUser: React.FC<{ status: Status; className?: string }> = ({ status, className = ' w-[12px] h-[12px] p-[2px]' }) => {
	return (
		<div className={`${className} status-user-background rounded-full`}>
			<div className={`w-full h-full rounded-full ${statusColors[status]} relative`}></div>
		</div>
	);
};
