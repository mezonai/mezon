import { useEffect, useState } from 'react';

export function useMediaPermissions() {
	const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
	const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean | null>(null);
	const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
	const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);

	useEffect(() => {
		const checkPermissions = async () => {
			try {
				const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
				const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

				setHasCameraAccess(cameraPermission.state === 'granted');
				setHasMicrophoneAccess(microphonePermission.state === 'granted');

				cameraPermission.onchange = () => setHasCameraAccess(cameraPermission.state === 'granted');
				microphonePermission.onchange = () => setHasMicrophoneAccess(microphonePermission.state === 'granted');
			} catch (error) {
				console.error('Access check error:', error);
				setHasCameraAccess(false);
				setHasMicrophoneAccess(false);
			}
		};

		checkPermissions();
	}, []);

	const requestCameraAccess = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			setCameraStream(stream);
			setHasCameraAccess(true);
			return stream;
		} catch (error) {
			console.error('Camera access denied:', error);
			setHasCameraAccess(false);
			return null;
		}
	};

	const requestMicrophoneAccess = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			setMicrophoneStream(stream);
			setHasMicrophoneAccess(true);
			return stream;
		} catch (error) {
			console.error('Microphone access denied:', error);
			setHasMicrophoneAccess(false);
			return null;
		}
	};

	return {
		hasCameraAccess,
		hasMicrophoneAccess,
		requestCameraAccess,
		requestMicrophoneAccess,
		cameraStream,
		microphoneStream
	};
}
