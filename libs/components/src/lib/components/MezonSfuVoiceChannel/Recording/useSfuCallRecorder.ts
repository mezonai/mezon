import { getStore, selectIsVoiceRecording, voiceActions } from '@mezon/store';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { callRecorder } from '../../VoiceChannel/Recording/callRecorder';
import type { RecordingAudioSource, RecordingSceneTile } from '../../VoiceChannel/Recording/types';

interface UseSfuCallRecorderParams {
	tiles: RecordingSceneTile[];
	audioSources: RecordingAudioSource[];
}

export const useSfuCallRecorder = ({ tiles, audioSources }: UseSfuCallRecorderParams) => {
	const isRecording = useSelector(selectIsVoiceRecording);
	const sourceRef = useRef({ tiles, audioSources });
	sourceRef.current = { tiles, audioSources };

	useEffect(
		() =>
			callRecorder.setSource({
				scene: () => sourceRef.current.tiles,
				audio: () => sourceRef.current.audioSources
			}),
		[]
	);

	useEffect(() => {
		if (!isRecording) return;
		callRecorder.syncScene(tiles);
		callRecorder.syncAudio(audioSources);
	}, [audioSources, isRecording, tiles]);

	useEffect(
		() => () => {
			if (!callRecorder.isRecording) {
				getStore().dispatch(voiceActions.resetRecordingState());
				return;
			}
			void callRecorder.stop().finally(() => getStore().dispatch(voiceActions.resetRecordingState()));
		},
		[]
	);
};
