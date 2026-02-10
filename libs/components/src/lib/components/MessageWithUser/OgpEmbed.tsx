import { getStore, selectCurrentChannel, selectCurrentDM, selectMessageByMessageId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import type { IMessageSendPayload } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React from 'react';

interface OgpEmbedProps {
	url: string;
	title?: string;
	description?: string;
	image?: string;
	messageId?: string;
}

const OgpEmbed: React.FC<OgpEmbedProps> = ({ url, title, description, image, messageId }) => {
	const { clientRef, sessionRef, socketRef } = useMezon();

	const handleCloseOgp = async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		e.preventDefault();
		e.stopPropagation();

		const state = getStore().getState();
		const currentChannel = selectCurrentChannel(state);
		const currentDM = selectCurrentDM(state);
		const channelOrDirect = currentChannel || currentDM;
		const session = sessionRef.current;
		const client = clientRef.current;
		const socket = socketRef.current;
		if (!client || !session || !socket || !channelOrDirect || !messageId) {
			throw new Error('Client is not initialized');
		}
		const message = selectMessageByMessageId(state, channelOrDirect.channel_id, messageId);

		const mode =
			channelOrDirect?.type === ChannelType.CHANNEL_TYPE_THREAD
				? ChannelStreamMode.STREAM_MODE_THREAD
				: channelOrDirect?.type === ChannelType.CHANNEL_TYPE_DM
					? ChannelStreamMode.STREAM_MODE_DM
					: channelOrDirect?.type === ChannelType.CHANNEL_TYPE_GROUP
						? ChannelStreamMode.STREAM_MODE_GROUP
						: ChannelStreamMode.STREAM_MODE_CHANNEL;

		const trimContent: IMessageSendPayload = {
			...(message.content as IMessageSendPayload),
			t: message.content?.t?.trim(),
			mk: message.content?.mk?.slice(0, -1)
		};
		await socket.updateChatMessage(
			channelOrDirect.clan_id || '0',
			channelOrDirect.channel_id ?? '0',
			mode,
			!channelOrDirect.channel_private,
			messageId,
			trimContent,
			message.mentions,
			message.attachments,
			message.hide_editted,
			message.topic_id || '0',
			false
		);
	};

	return (
		<div className="flex flex-col gap-0.5 max-w-[350px]">
			<div
				className="group relative flex flex-col gap-1.5 rounded-lg p-2.5 shadow-lg transition-all bg-highlight-no-hover-left-meta bg-theme-setting-nav cursor-pointer"
				onClick={() => {
					if (url) {
						window.open(url, '_blank', 'noopener,noreferrer');
					}
				}}
			>
				{(!!title || !!description) && (
					<div className="flex flex-col gap-0.5">
						{!!title && (
							<a
								href={url || '#'}
								onClick={(e) => e.preventDefault()}
								className="text-[14px] font-bold text-blue-500 hover:text-blue-400 hover:underline transition-colors line-clamp-2 leading-snug"
							>
								{title}
							</a>
						)}
						{!!description && <p className="text-[12px] leading-normal text-theme-primary line-clamp-2 opacity-90">{description}</p>}
					</div>
				)}

				<div className="relative mt-1 overflow-hidden rounded border border-white/5 bg-theme-setting-primary">
					<img
						className={`w-full h-auto object-cover max-h-[200px] transition-transform duration-500 group-hover:scale-[1.02] ${
							!image ? 'opacity-30' : ''
						}`}
						src={image || '/assets/images/warning.svg'}
						alt={title}
						onError={(e) => {
							e.currentTarget.src = '/assets/images/warning.svg';
							e.currentTarget.classList.add('opacity-30');
						}}
					/>
				</div>

				<div
					className="hover:text-red-500 absolute top-1 right-1 rounded-full aspect-square p-1 cursor-pointer bg-item-theme-hover"
					onClick={handleCloseOgp}
				>
					<Icons.Close defaultSize="w-3 h-3" />
				</div>
			</div>
		</div>
	);
};

export default OgpEmbed;
