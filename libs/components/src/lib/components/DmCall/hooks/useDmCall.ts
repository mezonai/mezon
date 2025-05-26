import { useRef } from 'react';
import { DmCallAudioHookReturn, useDmCallAudio } from './useDmCallAudio';
import { DmCallStateHookReturn, useDmCallState } from './useDmCallState';

export interface DmCallHookReturn extends DmCallAudioHookReturn, DmCallStateHookReturn {
	dmCallingRef: React.RefObject<{ triggerCall: (isVideoCall?: boolean, isAnswer?: boolean) => void }>;
}

export interface DmCallHookParams {
	userId: string;
}

export const useDmCall = ({ userId }: DmCallHookParams): DmCallHookReturn => {
	const dmCallingRef = useRef<{ triggerCall: (isVideoCall?: boolean, isAnswer?: boolean) => void }>(null);

	const audioHooks = useDmCallAudio();

	const stateHooks = useDmCallState({ userId, dmCallingRef });

	return {
		...audioHooks,
		...stateHooks,
		dmCallingRef
	};
};
