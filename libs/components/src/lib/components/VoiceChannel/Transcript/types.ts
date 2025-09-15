export type IncomingTranscriptEntry = {
	participantIdentity: string;
	participantName: string;
	seq: number;
	isFinal: boolean;
	language?: string | null;
	text: string;
	timestamp: number; // ms
};

export type ActiveUtterance = {
	seq: number;
	text: string;
	startedAt: number;
	participantIdentity: string;
	participantName: string;
};

export type TranscriptItem = {
	id: string;
	timestamp: string;
	speaker?: string;
	text: string;
};

export interface TranscriptPanelProps {
	items?: TranscriptItem[];
	title?: string;
	onClose?: () => void;
}
