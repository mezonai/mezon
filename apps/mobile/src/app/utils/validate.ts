import { validTextInputRegex, validTextInputRegexEmoji } from './helpers';

export const validInput = (value: string, includeEmoji = false) => {
	if (!value?.trim?.()?.length) return false;

	if (includeEmoji) {
		return validTextInputRegexEmoji.test(value);
	}

	return validTextInputRegex.test(value);
};
