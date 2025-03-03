import type { CaptureOptionsBySource, ToggleSource } from '@livekit/components-core';
import { useTrackToggle } from '@livekit/components-react';
import { Icons } from '@mezon/ui';
import { Track, TrackPublishOptions } from 'livekit-client';
import { ButtonHTMLAttributes, ForwardedRef, ReactNode, RefAttributes, forwardRef } from 'react';

export interface TrackToggleProps<T extends ToggleSource> extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
	source: T;
	initialState?: boolean;
	onChange?: (enabled: boolean, isUserInitiated: boolean) => void;
	captureOptions?: CaptureOptionsBySource<T>;
	publishOptions?: TrackPublishOptions;
	onDeviceError?: (error: Error) => void;
}

export const TrackToggle: <T extends ToggleSource>(props: TrackToggleProps<T> & RefAttributes<HTMLButtonElement>) => ReactNode = forwardRef(
	function TrackToggle<T extends ToggleSource>({ ...props }: TrackToggleProps<T>, ref: ForwardedRef<HTMLButtonElement>) {
		const { buttonProps, enabled } = useTrackToggle(props);
		return (
			<button ref={ref} {...buttonProps}>
				{getSourceIcon(props.source, enabled)}
				{props.children}
			</button>
		);
	}
);

export function getSourceIcon(source: Track.Source, enabled: boolean) {
	switch (source) {
		case Track.Source.Microphone:
			return enabled ? <Icons.VoiceMicIcon scale={1.3} /> : <Icons.VoiceMicDisabledIcon scale={1.3} />;
		case Track.Source.Camera:
			return enabled ? <Icons.VoiceCameraIcon scale={1.5} /> : <Icons.VoiceCameraDisabledIcon scale={1.5} />;
		case Track.Source.ScreenShare:
			return enabled ? <Icons.VoiceScreenShareStopIcon /> : <Icons.VoiceScreenShareIcon />;
		default:
			return undefined;
	}
}
