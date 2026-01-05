import { useLocalParticipant } from '@livekit/components-react';
import { selectIsInCall, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store';
import { memo, useEffect, useRef } from 'react';


export const VoiceTrackState = memo(() => {
	const dispatch = useAppDispatch();
	const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant();
	const isInCall = useAppSelector(selectIsInCall);
	const hasMutedRef = useRef(false);

	useEffect(() => {
		if (isInCall) {
			console.log(hasMutedRef.current, 'hasMutedRef.current');
			
			if (!hasMutedRef.current) {
				if (isMicrophoneEnabled) {
					localParticipant.setMicrophoneEnabled(false);
					dispatch(voiceActions.setShowMicrophone(false));
				}
				if (isCameraEnabled) {
					localParticipant.setCameraEnabled(false);
					dispatch(voiceActions.setShowCamera(false));
				}
				hasMutedRef.current = true;
			}
		} else {
			hasMutedRef.current = false;
		}
	}, [isInCall, isMicrophoneEnabled, isCameraEnabled, localParticipant, dispatch]);



	return null;
});

VoiceTrackState.displayName = 'VoiceTrackState';
