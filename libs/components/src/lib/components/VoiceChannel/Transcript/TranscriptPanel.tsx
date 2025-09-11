import React from 'react';

export type TranscriptItem = {
	id: string;
	// ISO timestamp or readable time string
	timestamp: string;
	// Display name of the speaker
	speaker?: string;
	// Content of the transcript line
	text: string;
};

export interface TranscriptPanelProps {
	items?: TranscriptItem[];
	title?: string;
	onClose?: () => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ items = [], title = 'Transcript', onClose }) => {
	return (
		<div className="w-full h-screen bg-theme-primary text-theme-primary flex flex-col">
			<div className="flex items-center justify-between px-4 py-3 ">
				<h3 className="text-theme-primary font-semibold">{title}</h3>
				{onClose && (
					<button onClick={onClose} className="text-theme-primary text-xs">
						Close
					</button>
				)}
			</div>
			<div className="flex-1 overflow-auto p-3">
				{items.length === 0 ? (
					<div className="text-theme-primary text-sm">No transcript yet. When speech is detected, it will appear here.</div>
				) : (
					<ul className="space-y-2">
						{items.map((it) => (
							<li key={it.id} className="text-[15px] text-theme-message font-semibold">
								<div className="text-[11px]">
									{it.timestamp}
									{it.speaker ? ` • ${it.speaker}` : ''}
								</div>
								<div className="leading-relaxed whitespace-pre-wrap">{it.text}</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default TranscriptPanel;
