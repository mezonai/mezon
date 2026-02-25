import type { IEmbedProps, ObserveFn } from '@mezon/utils';
import { EmbedAuthor } from './components/EmbedAuthor';
import { EmbedDescription } from './components/EmbedDescription';
import { EmbedFields } from './components/EmbedFields';
import { EmbedFooter } from './components/EmbedFooter';
import { EmbedImage } from './components/EmbedImage';
import { EmbedThumbnail } from './components/EmbedThumbnail';
import { EmbedTitle } from './components/EmbedTitle';

interface EmbedMessageProps {
	embed: IEmbedProps;
	senderId?: string;
	message_id?: string;
	onClick?: () => void;
	channelId: string;
	observeIntersectionForLoading?: ObserveFn;
}

export function EmbedMessage({ embed, message_id, senderId, onClick, channelId, observeIntersectionForLoading }: EmbedMessageProps) {
	const { color, title, url, author, description, fields, image, timestamp, footer, thumbnail } = embed;
	return (
		<div className="max-w-[520px] shadow-sm rounded-lg text-left relative mt-2  bg-theme-setting-primary border-theme-primary text-theme-message">
			<div className="flex flex-col px-5 pt-2 pb-4">
				<div className={`absolute left-0 top-0 h-full w-1 `} style={{ backgroundColor: color }} />
				<div className={'flex flex-row justify-between'}>
					<div className={`flex flex-col break-words break-all ${thumbnail && 'pr-2'}`}>
						{author && <EmbedAuthor {...author} />}
						{title && <EmbedTitle title={title} url={url} onClick={onClick} />}
						{description && <EmbedDescription description={description} />}
						{fields && (
							<EmbedFields
								fields={fields}
								message_id={message_id as string}
								senderId={senderId as string}
								channelId={channelId}
								observeIntersectionForLoading={observeIntersectionForLoading}
							/>
						)}
					</div>
					<div>{thumbnail && <EmbedThumbnail url={thumbnail.url} />}</div>
				</div>

				{image && <EmbedImage url={image.url} width={image.width} height={image.height} />}
				{(footer || timestamp) && <EmbedFooter {...footer} timestamp={timestamp} />}
			</div>
		</div>
	);
}
