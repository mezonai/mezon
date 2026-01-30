import type { Editor } from '@tiptap/react';
import type { Client, Session } from 'mezon-js';

export interface CanvasData {
	id: string;
	title?: string;
	content?: string;
	creator_id?: string;
	is_default?: boolean;
	channel_id?: string;
	clan_id?: string;
	create_time?: string;
}

export interface UseCanvasReturn {
	title: string;
	content: string;
	canvasId: string;
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	canEdit: boolean;
	hasChanges: boolean;
	updateTitle: (title: string) => void;
	updateContent: (content: string) => void;
	saveCanvas: () => Promise<void>;
	discardChanges: () => void;
}

export interface CanvasEditorProps {
	content: string;
	editable: boolean;
	onChange: (content: string) => void;
}

export interface ImageUploadContext {
	editor: Editor | null;
	sessionRef: React.MutableRefObject<Session | null>;
	clientRef: React.MutableRefObject<Client | null>;
	clanId: string;
	channelId: string;
}
