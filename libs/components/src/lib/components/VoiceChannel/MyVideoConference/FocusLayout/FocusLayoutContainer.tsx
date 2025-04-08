import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
import { ParticipantTile } from '../ParticipantTile/ParticipantTile';

export type FocusLayoutContainerProps = React.HTMLAttributes<HTMLDivElement> & {
	isShowMember: boolean;
};

export function FocusLayoutContainer({ children, isShowMember, ...props }: FocusLayoutContainerProps) {
	return (
		<div className={`lk-focus-layout !grid-cols-1 ${isShowMember ? '!grid-rows-[5fr_1fr]' : ''} `} {...props}>
			{children}
		</div>
	);
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
	trackRef?: TrackReferenceOrPlaceholder;
	onParticipantClick?: (evt: ParticipantClickEvent) => void;
	isExtCalling?: boolean;
}

export function FocusLayout({ trackRef, isExtCalling = false, ...htmlProps }: FocusLayoutProps) {
	return <ParticipantTile isExtCalling={isExtCalling} trackRef={trackRef} {...htmlProps} />;
}
