import { Icons } from '@mezon/ui';
import { memo } from 'react';

interface CallControlsProps {
	onCancel: () => void;
	loading: boolean;
	isVideo: boolean;
}

export const CallControls = memo<CallControlsProps>(({ onCancel, loading, isVideo }) => {
	return (
		<div className="flex items-center justify-center gap-4">
			<button
				className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
				onClick={onCancel}
				disabled={loading}
				title="Cancel call"
			>
				<Icons.IconPhoneDM className="w-6 h-6" />
			</button>
		</div>
	);
});

CallControls.displayName = 'CallControls';
