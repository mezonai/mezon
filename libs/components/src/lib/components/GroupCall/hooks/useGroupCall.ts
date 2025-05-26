import { useGroupCallAudio } from './useGroupCallAudio';
import { useGroupCallChat } from './useGroupCallChat';
import { useGroupCallSignaling } from './useGroupCallSignaling';
import { useGroupCallState } from './useGroupCallState';

export interface GroupCallHookReturn {
	// State from useGroupCallState
	state: ReturnType<typeof useGroupCallState>;
	// Audio from useGroupCallAudio
	audio: ReturnType<typeof useGroupCallAudio>;
	// Signaling from useGroupCallSignaling
	signaling: ReturnType<typeof useGroupCallSignaling>;
	// Chat from useGroupCallChat
	chat: ReturnType<typeof useGroupCallChat>;
}

interface UseGroupCallParams {
	currentGroup: any;
}

export const useGroupCall = ({ currentGroup }: UseGroupCallParams): GroupCallHookReturn => {
	const state = useGroupCallState();
	const audio = useGroupCallAudio();
	const signaling = useGroupCallSignaling();
	const chat = useGroupCallChat({ currentGroup });

	return {
		state,
		audio,
		signaling,
		chat
	};
};

// Export individual hooks for granular usage
export { useGroupCallAudio } from './useGroupCallAudio';
export { useGroupCallChat } from './useGroupCallChat';
export { useGroupCallSignaling } from './useGroupCallSignaling';
export { useGroupCallState } from './useGroupCallState';
