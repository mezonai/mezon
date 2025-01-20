import { IMarkdownOnMessage } from '../types';
import { isOutsideRange } from './detectTokenMessage';

export const filterItemsOutsideMarkdown = <T extends { s?: number; e?: number }>(list: T[], markdownList: IMarkdownOnMessage[]): T[] => {
	return list.filter((item) => item.s !== undefined && item.e !== undefined && isOutsideRange(item.s, item.e, markdownList));
};
