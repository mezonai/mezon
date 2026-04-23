import type { ICategoryChannel, IChannel } from '@mezon/utils';
import { createContext, useContext } from 'react';

export type ChannelListMergedRowsContextValue = {
	mergedRows: Array<ICategoryChannel | IChannel> | undefined;
};

export const ChannelListMergedRowsContext = createContext<ChannelListMergedRowsContextValue | null>(null);

export function useChannelListMergedRows(): ChannelListMergedRowsContextValue | null {
	return useContext(ChannelListMergedRowsContext);
}
