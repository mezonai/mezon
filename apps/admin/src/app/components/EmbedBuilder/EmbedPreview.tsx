import { EmbedMessage, MessageActionsPanel } from '@mezon/components';
import type { IEmbedProps } from '@mezon/utils';
import React from 'react';
import type { IEmbedObject } from './context/EmbedBuilderContext';
import { useEmbedBuilder } from './context/EmbedBuilderContext';

const DEFAULT_PLACEHOLDER_IMAGE = 'http://127.0.0.1:4200/assets/images/mezon-logo-white.svg';

export const EmbedPreview: React.FC = () => {
	const { data } = useEmbedBuilder();
	const isValidUrl = (url: string): boolean => {
		return /^(https?|data|blob|file):/.test(url);
	};
	const normalizeUrl = (url: string | undefined, defaultUrl: string = DEFAULT_PLACEHOLDER_IMAGE) => {
		if (!url) return '';
		return isValidUrl(url) ? url : defaultUrl;
	};
	const transformToEmbedProps = (embed: IEmbedObject): IEmbedProps => {
		const result: IEmbedObject = {
			...embed,
			author: embed.author
				? {
						...embed.author,
						icon_url: embed.author?.icon_url ? normalizeUrl(embed.author.icon_url) : undefined
					}
				: undefined,
			thumbnail: embed.thumbnail ? { ...embed.thumbnail, url: normalizeUrl(embed.thumbnail.url) } : undefined,
			image: embed.image ? { ...embed.image, url: normalizeUrl(embed.image.url) } : undefined,
			footer: embed.footer ? { ...embed.footer, icon_url: normalizeUrl(embed.footer.icon_url) } : undefined
		};
		return {
			...result
		} as unknown as IEmbedProps;
	};

	const mockProps = {
		message_id: 'preview-id',
		channelId: 'preview-channel',
		senderId: 'preview-sender',
		embed: data.embed ? transformToEmbedProps(data.embed) : undefined
	};

	return (
		<div className="h-full flex flex-col">
			<div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
				<h3 className="font-semibold text-gray-700">Live Preview</h3>
				<div className="text-xs text-gray-400">View as User</div>
			</div>

			<div className="flex-1 bg-[#ffffff] p-8 overflow-y-auto flex justify-center items-start">
				<div className="w-full max-w-[520px] space-y-2">
					{/* Display text content if exists */}
					{/*{data.content && <div className="text-white mb-2">{data.content}</div>}*/}

					{/* Display embed message */}
					{mockProps.embed && Object.keys(mockProps.embed).length > 0 && (
						<EmbedMessage
							message_id={mockProps.message_id}
							channelId={mockProps.channelId}
							senderId={mockProps.senderId}
							embed={mockProps.embed}
						/>
					)}

					{/* Render Action Rows below embed */}
					{data.components?.map((actionRow, index) => (
						<MessageActionsPanel
							key={index}
							actionRow={actionRow}
							messageId={mockProps.message_id}
							senderId={mockProps.senderId}
							channelId={mockProps.channelId}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
