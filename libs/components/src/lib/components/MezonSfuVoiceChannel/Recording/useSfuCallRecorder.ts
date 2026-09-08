import { useEffect } from 'react';
import { sfuCallRecorder } from './callRecorder';
import type { RecordingAudioSource, RecordingSceneTile } from './types';

export interface UseSfuCallRecorderParams {
	tiles: RecordingSceneTile[];
	audioSources: RecordingAudioSource[];
}

export function useSfuCallRecorder({ tiles, audioSources }: UseSfuCallRecorderParams): void {
	useEffect(() => {
		return sfuCallRecorder.setSource({
			scene: () => tiles,
			audio: () => audioSources
		});
	}, [tiles, audioSources]);

	useEffect(() => {
		if (!sfuCallRecorder.isRecording) return;
		sfuCallRecorder.syncScene(tiles);
	}, [tiles]);

	useEffect(() => {
		if (!sfuCallRecorder.isRecording) return;
		sfuCallRecorder.syncAudio(audioSources);
	}, [audioSources]);
}
