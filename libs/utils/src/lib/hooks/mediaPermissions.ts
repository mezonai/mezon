import { useEffect, useState } from 'react';

export function useMediaPermissions() {
	const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
	const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean | null>(null);

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

	return { hasCameraAccess, hasMicrophoneAccess };
}
