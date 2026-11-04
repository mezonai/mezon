import { MezonIcon, MzIcons16 } from '@mezon/ui';

export const RenderTypingIndicator = () => (
	<span className="shrink-0 rounded-lg flex items-center justify-center px-[2px] py-[1px] bg-colorSuccess">
		<MezonIcon icon={MzIcons16.mzTyping} className="mz-on dark:text-textDarkTheme text-textPrimaryLight" />
	</span>
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
