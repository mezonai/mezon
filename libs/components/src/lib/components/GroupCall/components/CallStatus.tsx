import { memo } from 'react';

interface CallStatusProps {
	isConnecting: boolean;
	isConnected: boolean;
	participantCount: number;
	callStartTime?: number;
	groupName: string;
	groupAvatar?: string;
}

export const CallStatus = memo<CallStatusProps>(({ isConnecting, isConnected, participantCount, callStartTime, groupName, groupAvatar }) => {
	const getCallDuration = () => {
		if (!callStartTime || !isConnected) return null;

		const duration = Date.now() - callStartTime;
		const seconds = Math.floor(duration / 1000) % 60;
		const minutes = Math.floor(duration / (1000 * 60));

		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	return (
		<div className="text-center space-y-2">
			<div className="flex items-center justify-center gap-3">
				{groupAvatar ? (
					<img className="w-12 h-12 rounded-full object-cover" src={groupAvatar} alt="" />
				) : (
					<div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
						<span className="text-white font-semibold text-lg">{groupName.charAt(0).toUpperCase()}</span>
					</div>
				)}
				<div>
					<h3 className="text-lg font-semibold dark:text-white text-black">{groupName}</h3>
				</div>
			</div>

			{getCallDuration() && <div className="text-sm text-gray-400">{getCallDuration()}</div>}

			{isConnecting && (
				<div className="flex items-center justify-center space-x-1">
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
							style={{
								animationDelay: `${i * 0.2}s`,
								animationDuration: '1s'
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
});

CallStatus.displayName = 'CallStatus';
