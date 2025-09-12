import { Icons } from '@mezon/ui';
import React, { useEffect, useRef, useState } from 'react';

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
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isAtBottom, setIsAtBottom] = useState(true);

	// Detect scroll position
	const handleScroll = () => {
		if (!scrollRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 50);
	};

	// Auto-scroll only if already at bottom
	useEffect(() => {
		if (isAtBottom && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [items, isAtBottom]);

	//button
	const scrollToBottom = () => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: 'smooth'
			});
		}
	};

	return (
		<div className="w-full h-screen bg-theme-primary text-theme-primary flex flex-col">
			<div className="flex items-center justify-between px-4 h-[50px] ">
				<h3 className="text-theme-primary font-semibold">{title}</h3>
				{onClose && (
					<button onClick={onClose} className="text-theme-primary text-xs">
						<Icons.Close defaultSize="w-5 h-5" />
					</button>
				)}
			</div>
			<div className="flex-1 overflow-auto bg-input-theme" ref={scrollRef} onScroll={handleScroll}>
				{items.length === 0 ? (
					<div className="text-theme-primary text-sm p-5">No transcript yet. When speech is detected, it will appear here.</div>
				) : (
					<ul className="space-y-2 px-2 pt-2">
						{items.map((it) => (
							<li key={it.id} className="text-[15px] text-theme-message font-semibold pl-1">
								<div className="text-[11px]">
									{it.timestamp}
									{it.speaker ? ` • ${it.speaker}` : ''}
								</div>
								<div className="leading-relaxed whitespace-pre-wrap">{it.text}</div>
							</li>
						))}
					</ul>
				)}
				{!isAtBottom && (
					<button
						onClick={scrollToBottom}
						className="absolute bottom-4 right-4 text-theme-message px-3 py-1 rounded-full shadow-md bg-button-hover transition"
					>
						↓ Scroll to bottom
					</button>
				)}
			</div>
		</div>
	);
};

export default TranscriptPanel;
