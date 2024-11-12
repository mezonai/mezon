import React from 'react';
import RenderMessageMapView from '../../../components/RenderMessageMapView';
import RenderMessageInvite from './components/RenderMessageInvite';
function RenderMessageBlock({
	isInviteLink,
	isGoogleMapsLink,
	                            contentMessage
}: {
	isGoogleMapsLink: boolean;
	isInviteLink: boolean;
	contentMessage: string;
}) {
	if (isInviteLink) return <RenderMessageInvite content={contentMessage} />;
	if (isGoogleMapsLink) return <RenderMessageMapView content={contentMessage} />;
	return null;
}

export default React.memo(RenderMessageBlock);
