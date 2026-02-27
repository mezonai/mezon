export type ParsedPollData = {
	question: string;
	answers: string[];
	duration: string;
	allowMultipleAnswers: boolean;
};

/**
 * Parse poll data from message content
 * Format:
 * 📊 **Question**
 *
 * 1. Answer1
 * 2. Answer2
 * ...
 *
 * ⏱️ Duration: 24 hours
 * ☑️ Multiple answers allowed / 🔘 Single answer only
 */
export const parsePollData = (messageContent: string): ParsedPollData | null => {
	if (!messageContent || !messageContent.startsWith('📊')) {
		return null;
	}

	try {
		const lines = messageContent.split('\n').filter((line) => line.trim() !== '');

		// Extract question (first line after 📊)
		const questionLine = lines[0];
		const question = questionLine.replace('📊', '').replace(/\*\*/g, '').trim();

		// Extract answers (lines starting with numbers)
		const answers: string[] = [];
		for (const line of lines) {
			const match = line.match(/^\d+\.\s*(.+)$/);
			if (match) {
				answers.push(match[1].trim());
			}
		}

		// Extract duration
		const durationLine = lines.find((line) => line.includes('⏱️ Duration:'));
		const duration = durationLine ? durationLine.replace('⏱️ Duration:', '').trim() : '24 hours';

		// Check if multiple answers allowed
		const allowMultipleAnswers = messageContent.includes('☑️ Multiple answers allowed');

		return {
			question,
			answers,
			duration,
			allowMultipleAnswers
		};
	} catch (error) {
		console.error('Failed to parse poll data:', error);
		return null;
	}
};
