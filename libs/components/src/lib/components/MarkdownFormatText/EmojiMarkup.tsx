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
			style={{ height: onlyEmoji ? 48 : 24 }}
			id={`emoji-${emojiSyntax}`}
			src={srcEmoji}
			alt={`[${emojiSyntax}](${emojiId})`}
			className={`${onlyEmoji ? 'w-12' : 'w-6'} inline-block relative -top-0.4 m-0`}
			draggable="false"
		/>
	) : (
		<PlainText text={emojiSyntax} />
	);
};

export default EmojiMarkup;
