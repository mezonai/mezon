import type { LoadingStatus } from '@mezon/utils';
import React, { memo, useState } from 'react';
import type { SfuJoinRole } from '../MezonSfuVoiceChannel/types';

interface JoinFormProps {
	username: string;
	setUsername: (value: string) => void;
	onJoin: (role: SfuJoinRole) => void;
	loadingStatus: LoadingStatus;
}

const JoinForm = memo(({ username, setUsername, onJoin, loadingStatus }: JoinFormProps) => {
	const isLoading = loadingStatus === 'loading';
	const isDisabled = loadingStatus === 'loaded' || isLoading;
	const [joinRole, setJoinRole] = useState<SfuJoinRole>('speaker');
	const [showJoinOptions, setShowJoinOptions] = useState(false);
	const joinLabel = joinRole === 'speaker' ? 'Join as speaker' : 'Join as audience';

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const sanitized = e.target.value
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '')
			.slice(0, 12);
		setUsername(sanitized);
	};

	return (
		<div className="w-full flex flex-col gap-3 mb-6">
			<input
				type="text"
				placeholder="Enter name (a-z, 0-9, max 12 chars)"
				value={username}
				maxLength={12}
				onChange={handleChange}
				className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
				aria-label="Enter your username"
			/>
			<div className="relative flex w-full">
				<button
					type="button"
					onClick={() => onJoin(joinRole)}
					disabled={isDisabled}
					className={`flex-1 rounded-l px-6 py-2 text-white font-medium transition whitespace-nowrap ${
						isDisabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
					}`}
				>
					{isLoading ? 'Joining...' : joinLabel}
				</button>
				<button
					type="button"
					disabled={isDisabled}
					className={`px-3 rounded-r border-l border-indigo-500 text-white transition flex items-center justify-center ${
						isDisabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
					}`}
					onClick={() => setShowJoinOptions((visible) => !visible)}
					aria-label="Choose join role"
				>
					<svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
						<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
					</svg>
				</button>
				{showJoinOptions && (
					<div className="absolute left-0 bottom-full z-30 mb-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 text-left shadow-2xl">
						{(['speaker', 'audience'] as const).map((role) => (
							<button
								key={role}
								type="button"
								className={`block w-full px-4 py-2.5 text-left text-sm text-white hover:bg-zinc-800 ${
									joinRole === role ? 'font-semibold text-indigo-400 bg-zinc-800/50' : ''
								}`}
								onClick={() => {
									setJoinRole(role);
									setShowJoinOptions(false);
								}}
							>
								Join as {role}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
});

export { JoinForm };
