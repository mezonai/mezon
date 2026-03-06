export type ParsedPollData = {
	question: string;
	questionEmojiId?: string;
	answers: string[];
	answerEmojiIds?: string[];
	duration: string;
	allowMultipleAnswers: boolean;
};

export const parsePollData = (messageContent: string): ParsedPollData | null => {
	if (!messageContent || !messageContent.startsWith('📊')) {
		return null;
	}

	try {
		const lines = messageContent.split('\n').filter((line) => line.trim() !== '');

		const questionLine = lines[0];
		const question = questionLine.replace('📊', '').replace(/\*\*/g, '').trim();

		const answers: string[] = [];
		for (const line of lines) {
			const match = line.match(/^\d+\.\s*(.+)$/);
			if (match) {
				answers.push(match[1].trim());
			}
		}

		const durationLine = lines.find((line) => line.includes('⏱️ Duration:'));
		const duration = durationLine ? durationLine.replace('⏱️ Duration:', '').trim() : '24 hours';

		const allowMultipleAnswers = messageContent.includes('☑️ Multiple answers allowed');

		let questionEmojiId: string | undefined;
		let answerEmojiIds: string[] | undefined;

		const emojiLine = lines.find((line) => line.startsWith('🔖'));
		if (emojiLine) {
			const emojiData = emojiLine.replace('🔖', '').trim();
			const parts = emojiData.split('|').map((p) => p.trim());

			for (const part of parts) {
				if (part.startsWith('q:')) {
					questionEmojiId = part.substring(2).trim();
				} else if (part.startsWith('a:')) {
					const emojiStr = part.substring(2).trim();

					answerEmojiIds = emojiStr.split(',').map((e) => e.trim());
				}
			}
		}

		return {
			question,
			questionEmojiId,
			answers,
			answerEmojiIds,
			duration,
			allowMultipleAnswers
		};
	} catch (error) {
		console.error('Failed to parse poll data:', error);
		return null;
	}
};
