import { memo } from 'react';
import RenderMessageMapView from '../../../components/RenderMessageMapView';
import RenderMessageInvite from './components/RenderMessageInvite';

interface IRenderMessageBlockProps {
	isGoogleMapsLink: boolean;
	isInviteLink: boolean;
	contentMessage: string;
	avatarUrl?: string;
	isSelf?: boolean;
	senderName?: string;
	senderUsername?: string;
}

function RenderMessageBlock({
	isInviteLink,
	isGoogleMapsLink,
	contentMessage,
	avatarUrl,
	isSelf,
	senderName,
	senderUsername
}: IRenderMessageBlockProps) {
	if (isInviteLink) return <RenderMessageInvite content={contentMessage} />;
	if (isGoogleMapsLink)
		return (
			<RenderMessageMapView
				content={contentMessage}
				avatarUrl={avatarUrl}
				isSelf={isSelf}
				senderName={senderName}
				senderUsername={senderUsername}
			/>
		);
	return null;
}

export default memo(RenderMessageBlock);
