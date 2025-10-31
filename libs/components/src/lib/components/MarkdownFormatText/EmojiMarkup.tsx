import { getSrcEmoji } from '@mezon/utils';
import PlainText from './PlainText';

type EmojiMarkupOpt = {
	emojiId: string;
	emojiSyntax: string;
	onlyEmoji: boolean;
	isOne: boolean;
};

export const EmojiMarkup: React.FC<EmojiMarkupOpt> = ({ emojiId, emojiSyntax, onlyEmoji, isOne }) => {
	const srcEmoji = getSrcEmoji(emojiId);

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
