import { useLocalParticipantPermissions } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useMemo } from 'react';
import type { ControlBarControls } from '../ControlBar';

export const trackSourceToProtocol = (source: Track.Source) => {
	switch (source) {
		case Track.Source.Camera:
			return 1;
		case Track.Source.Microphone:
			return 2;
		case Track.Source.ScreenShare:
			return 3;
		default:
			return 0;
	}
};

export function useControlBarPermissions(controls?: ControlBarControls) {
	const localPermissions = useLocalParticipantPermissions();

	const visibleControls = useMemo(() => {
		const visible = { leave: true, ...controls };

		// Recording is a purely local capture — it needs no publish permission.
		visible.recording ??= true;
		visible.voiceInteractive ??= true;

		if (!localPermissions) {
			visible.camera = false;
			visible.microphone = false;
			visible.screenShare = false;
		} else {
			const canPublishSource = (source: Track.Source) => {
				return (
					localPermissions.canPublish &&
					(localPermissions.canPublishSources.length === 0 || localPermissions.canPublishSources.includes(trackSourceToProtocol(source)))
				);
			};
			visible.camera ??= canPublishSource(Track.Source.Camera);
			visible.microphone ??= canPublishSource(Track.Source.Microphone);
			visible.screenShare ??= canPublishSource(Track.Source.ScreenShare);
		}

		return visible;
	}, [localPermissions, controls]);

	return visibleControls;
}
