import { getSrcEmoji, SHOW_POSITION } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useMessageContextMenu } from '../ContextMenu';
import PlainText from './PlainText';

type EmojiMarkupOpt = {
	emojiId: string;
	emojiSyntax: string;
	onlyEmoji: boolean;
	isOne: boolean;
};

export const EmojiMarkup: React.FC<EmojiMarkupOpt> = ({ emojiId, emojiSyntax, onlyEmoji, isOne }) => {
	const srcEmoji = useMemo(() => {
		return getSrcEmoji(emojiId);
	}, [emojiId]);

	const { setImageURL, setPositionShow } = useMessageContextMenu();

	const handleContextMenu = useCallback(() => {
		setImageURL(srcEmoji);
		setPositionShow(SHOW_POSITION.IN_EMOJI);
	}, [srcEmoji]);

	const emojiElement = (
		<img
			id={`emoji-${emojiSyntax}`}
			src={srcEmoji}
			alt={`[${emojiSyntax}](${emojiId})`}
			className={`${onlyEmoji ? 'w-12' : 'w-6'} inline-block relative -top-0.4 m-0`}
			onDragStart={(e) => e.preventDefault()}
		/>
	);
	return (
		<span onContextMenu={handleContextMenu} style={{ display: 'inline-block', height: onlyEmoji ? '50px' : 'auto' }}>
			{srcEmoji ? (
				// <Tooltip style={appearanceTheme === 'light' ? 'light' : 'dark'} content={<p style={{ width: 'max-content' }}>{emojiSyntax}</p>}>
				<div style={{ height: onlyEmoji ? 48 : 24 }}>{emojiElement}</div>
			) : (
				// </Tooltip>
				<PlainText text={emojiSyntax} />
			)}
		</span>
	);
};

export default memo(EmojiMarkup);
