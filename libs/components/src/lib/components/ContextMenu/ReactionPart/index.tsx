import { IEmoji } from '@mezon/utils';
import { memo } from 'react';
import ReactionItem from '../ReactionItem';

interface IReactionPart {
	emojiList: IEmoji[];
	activeMode: number | undefined;
	messageId: string;
	isOption: boolean;
}

const ReactionPart: React.FC<IReactionPart> = ({ emojiList, activeMode, messageId, isOption }) => {
	return (
		<div className={`flex justify-start gap-x-1 ${isOption ? '' : 'mb-1'}`}>
			{emojiList
				.filter((item) => !!item.id)
				.map((item, index) => (
					<ReactionItem
						key={index}
						emojiShortCode={item.shortname || ''}
						emojiId={item.id || ''}
						activeMode={activeMode}
						messageId={messageId}
						isOption={isOption}
					/>
				))}
		</div>
	);
};

export default memo(ReactionPart);
