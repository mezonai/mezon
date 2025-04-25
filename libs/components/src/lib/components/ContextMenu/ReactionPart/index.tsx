import { IEmoji, IMessageWithUser } from '@mezon/utils';
import { memo } from 'react';
import ReactionItem from '../ReactionItem';

interface IReactionPart {
	emojiList: IEmoji[];
	messageId: string;
	isOption: boolean;
	message: IMessageWithUser;
	isTopic: boolean;
}

const ReactionPart: React.FC<IReactionPart> = ({ emojiList, messageId, isOption, message, isTopic }) => {
	return (
		<div className={`flex justify-start gap-x-1 ${isOption ? '' : 'mb-1'}`}>
			{emojiList
				.filter((item) => !!item.id)
				.map((item, index) => (
					<ReactionItem
						key={index}
						emojiShortCode={item.shortname || ''}
						emojiId={item.id || ''}
						messageId={messageId}
						isOption={isOption}
						message={message}
						isTopic={isTopic}
					/>
				))}
		</div>
	);
};

export default memo(ReactionPart);
