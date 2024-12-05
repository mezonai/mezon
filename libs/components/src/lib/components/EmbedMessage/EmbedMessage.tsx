import { EmbedTypeForm, IEmbedProps } from '@mezon/utils';
import EmbedDaily from './EmbedDaily';
import { EmbedAuthor } from './components/EmbedAuthor';
import { EmbedDescription } from './components/EmbedDescription';
import { EmbedFields } from './components/EmbedFields';
import { EmbedFooter } from './components/EmbedFooter';
import { EmbedImage } from './components/EmbedImage';
import { EmbedThumbnail } from './components/EmbedThumbnail';
import { EmbedTitle } from './components/EmbedTitle';

export default function EmbedMessage({ embed, message_id, senderId }: { embed: IEmbedProps; message_id: string; senderId: string }) {
	const { color, title, url, author, description, fields, image, timestamp, footer, thumbnail, type } = embed;
	if (type === EmbedTypeForm.DAILY) {
		return <EmbedDaily embed={embed} message_id={message_id} senderId={senderId} />;
	}
	return (
		<div className="max-w-[520px] w-fit dark:bg-bgSecondary bg-bgLightSecondary rounded-lg overflow-hidden text-left relative mt-2 text-textLightTheme dark:text-textDarkTheme">
			<div className="flex flex-col px-5 pt-2 pb-4">
				<div className={`absolute left-0 top-0 h-full w-1`} style={{ backgroundColor: color }} />
				<div className={'flex flex-row justify-between'}>
					<div className={`flex flex-col ${thumbnail && 'pr-2'}`}>
						{author && <EmbedAuthor {...author} />}
						{title && <EmbedTitle title={title} url={url} />}
						{description && <EmbedDescription description={description} />}
						{fields && <EmbedFields fields={fields} message_id={message_id} senderId={senderId} />}
					</div>
					<div>{thumbnail && <EmbedThumbnail url={thumbnail.url} />}</div>
				</div>

				{image && <EmbedImage url={image.url} />}
				{(footer || timestamp) && <EmbedFooter {...footer} timestamp={timestamp} />}
			</div>
		</div>
	);
}
