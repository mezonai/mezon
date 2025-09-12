import { TranscriptPanel } from './TranscriptPanel';
import { useTranscript } from './useTranscript';

export function TranscriptDock({ onClose }: { onClose?: () => void }) {
	const { items } = useTranscript();
	return (
		<div className="w-full h-full flex-shrink-0 z-40 border-l border-border dark:border-bgTertiary bg-input-theme">
			<TranscriptPanel items={items} onClose={onClose} />
		</div>
	);
}

export default TranscriptDock;
