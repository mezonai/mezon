type TopicConversationVisibility = {
	channelId?: string;
	topicId?: string;
	currentChannelId?: string | null;
	currentTopicId?: string | null;
	isTopicOpen: boolean;
	isClanView: boolean;
	isFocused: boolean;
};

export function isTopicConversationVisible({
	channelId,
	topicId,
	currentChannelId,
	currentTopicId,
	isTopicOpen,
	isClanView,
	isFocused
}: TopicConversationVisibility): boolean {
	return Boolean(
		channelId &&
			channelId !== '0' &&
			topicId &&
			topicId !== '0' &&
			isTopicOpen &&
			isClanView &&
			isFocused &&
			channelId === currentChannelId &&
			topicId === currentTopicId
	);
}
