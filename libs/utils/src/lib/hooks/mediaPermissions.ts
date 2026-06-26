import { useCallback, useEffect, useState } from 'react';
import { checkMediaPermission } from '../utils';

export function useMediaPermissions() {
	const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
	const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean | null>(null);
	const [cameraPermissionState, setCameraPermissionState] = useState<'granted' | 'denied' | 'prompt' | null>(null);
	const [microphonePermissionState, setMicrophonePermissionState] = useState<'granted' | 'denied' | 'prompt' | null>(null);

	const refreshPermissions = useCallback(async () => {
		try {
			const micPermission = await checkMediaPermission('audio');
			setMicrophonePermissionState(micPermission);
			setHasMicrophoneAccess(micPermission === 'granted');

			const camPermission = await checkMediaPermission('video');
			setCameraPermissionState(camPermission);
			setHasCameraAccess(camPermission === 'granted');
		} catch (error) {
			console.error('Access check error:', error);
			setHasCameraAccess(false);
			setHasMicrophoneAccess(false);
		}
	}, []);

	useEffect(() => {
		refreshPermissions();
		if (navigator.permissions && navigator.permissions.query) {
			const setupPermissionListeners = async () => {
				try {
					const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
					const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

					cameraPermission.onchange = () => {
						const state = cameraPermission.state as 'granted' | 'denied' | 'prompt';
						setCameraPermissionState(state);
						setHasCameraAccess(state === 'granted');
					};

					microphonePermission.onchange = () => {
						const state = microphonePermission.state as 'granted' | 'denied' | 'prompt';
						setMicrophonePermissionState(state);
						setHasMicrophoneAccess(state === 'granted');
					};
				} catch (error) {
					console.error(error);
				}
			};

			setupPermissionListeners();
		}
	}, [refreshPermissions]);

	return {
		hasCameraAccess,
		hasMicrophoneAccess,
		cameraPermissionState,
		microphonePermissionState,
		refreshPermissions
	};
}
