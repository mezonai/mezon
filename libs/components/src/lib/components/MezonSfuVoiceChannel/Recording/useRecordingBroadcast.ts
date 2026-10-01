import type { RootState } from '@mezon/store';
import { RECORDING_ANNOUNCE_INTERVAL_MS, selectVoiceInfo, selectVoiceRecording, useAppDispatch, voiceActions } from '@mezon/store';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export function useRecordingBroadcast(): void {
	const dispatch = useAppDispatch();
	const isRecording = useSelector((state: RootState) => selectVoiceRecording(state).status === 'recording');
	const clanId = useSelector((state: RootState) => selectVoiceInfo(state)?.clanId);
	const channelId = useSelector((state: RootState) => selectVoiceInfo(state)?.channelId);

	useEffect(() => {
		if (!isRecording || !clanId || !channelId) return;
		const announce = (value: boolean) => dispatch(voiceActions.sendRecordingState({ isRecording: value, clanId, channelId }));
		announce(true);
		const timer = window.setInterval(() => announce(true), RECORDING_ANNOUNCE_INTERVAL_MS);
		return () => {
			window.clearInterval(timer);
			announce(false);
		};
	}, [isRecording, clanId, channelId, dispatch]);
}
