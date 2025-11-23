import { selectEmojiSuggestionEntities, useAppSelector } from '@mezon/store';
import type { IEmoji } from '@mezon/utils';
import { getEmojiUrl, getIdSaleItemFromSource } from '@mezon/utils';
import PlainText from './PlainText';

type EmojiMarkupOpt = {
	emojiId: string;
	emojiSyntax: string;
	onlyEmoji: boolean;
	isOne: boolean;
};

export const EmojiMarkup: React.FC<EmojiMarkupOpt> = ({ emojiId, emojiSyntax, onlyEmoji }) => {
	const emojiEntities = useAppSelector(selectEmojiSuggestionEntities);

	let emojiMetadata: IEmoji | undefined = emojiEntities[emojiId];

	if (!emojiMetadata) {
		emojiMetadata = Object.values(emojiEntities).find((e) => {
			if (e.is_for_sale && e.src) {
				const extractedId = getIdSaleItemFromSource(e.src);
				return extractedId === emojiId;
			}
			return false;
		});
	}

	const emojiData = emojiMetadata
		? {
				src: emojiMetadata.src,
				id: emojiMetadata.id,
				emojiId,
				creator_id: emojiMetadata.creator_id
			}
		: emojiId;

	const srcEmoji = getEmojiUrl(emojiData);

	return srcEmoji ? (
		<img
			title={emojiSyntax}
			src={srcEmoji}
			alt=""
			className={`${onlyEmoji ? 'max-w-[48px] h-12 block pt-1' : 'max-w-[24px] h-6'} inline-block relative -top-0.4 m-0 object-contain`}
			draggable="false"
		/>
	) : (
		<PlainText text={emojiSyntax} />
	);
};

export default EmojiMarkup;
