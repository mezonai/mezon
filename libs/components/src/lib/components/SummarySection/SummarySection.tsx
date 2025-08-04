import { Icons } from '@mezon/ui';
import { useEffect, useRef, useState } from 'react';

interface SummarySectionProps {
	summary?: string;
	audio?: boolean;
}

export const SummarySection = ({ summary, audio }: SummarySectionProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isReading, setIsReading] = useState(false);
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	useEffect(() => {
		return () => {
			if (utteranceRef.current) {
				speechSynthesis.cancel();
			}
		};
	}, []);

	if (!summary) return null;

	const shortSummary = summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
	const shouldShowToggle = summary.length > 150;

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const handleTextToSpeech = () => {
		if (!('speechSynthesis' in window)) {
			console.warn('Text-to-speech not supported in this browser');
			return;
		}

		if (isReading) {
			speechSynthesis.cancel();
			setIsReading(false);
			return;
		}

		const utterance = new SpeechSynthesisUtterance(summary);

		utterance.lang = 'vi-VN';
		utterance.rate = 0.9;
		utterance.pitch = 1;
		utterance.volume = 1;

		utterance.onstart = () => {
			setIsReading(true);
		};

		utterance.onend = () => {
			setIsReading(false);
		};

		utterance.onerror = () => {
			setIsReading(false);
			console.error('Text-to-speech error occurred');
		};

		utteranceRef.current = utterance;
		speechSynthesis.speak(utterance);
	};

	return (
		<div className="summary bg-theme-primary/5 rounded-lg p-3 my-2 border border-theme-primary">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1">
					<div className="text-xs font-medium text-theme-primary mb-1">Summary</div>
					<div className="text-sm text-theme-primary leading-relaxed">{isExpanded ? summary : shortSummary}</div>
				</div>
				<div className="flex items-center gap-1 mt-4">
					{audio && (
						<button
							onClick={handleTextToSpeech}
							className={`flex-shrink-0 p-1 rounded transition-colors duration-150 ${isReading ? 'bg-theme-primary text-white' : 'bg-button-secondary hover:bg-button-hover'}`}
							title={isReading ? 'Stop reading' : 'Read text content'}
						>
							{isReading ? <Icons.MutedVolume className="w-4 h-4" /> : <Icons.Speaker defaultSize="w-4 h-4" />}
						</button>
					)}

					{shouldShowToggle && (
						<button
							onClick={toggleExpand}
							className="flex-shrink-0 p-1 bg-button-secondary hover:bg-button-hover rounded transition-colors duration-150"
							title={isExpanded ? 'Collapse summary' : 'Expand summary'}
						>
							<Icons.ThreeDot defaultSize="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
			{isExpanded && shouldShowToggle && (
				<button
					onClick={toggleExpand}
					className="mt-2 px-2 py-1 text-xs bg-button-secondary text-theme-primary hover:bg-button-hover hover:text-theme-primary rounded transition-colors duration-150"
				>
					Show less
				</button>
			)}
		</div>
	);
};
