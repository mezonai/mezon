import type { ICategoryChannel, IChannel } from '@mezon/utils';
import { createSelectorCreator, weakMapMemoize } from '@reduxjs/toolkit';
import type { CategoriesEntity } from '../categories/categories.slice';
import { selectCategoryEntityStateByClanId } from '../categories/categories.slice';
import type { RootState } from '../store';
import { buildListChannelRender, sortCategoriesByOrder } from './buildListChannelRender';
import type { ChannelsEntity } from './channels.slice';
import { selectChannelEntityStateByClanId, selectFavoriteChannelsByClanId } from './channels.slice';

const createCachedSelector = createSelectorCreator({
	memoize: weakMapMemoize,
	argsMemoize: weakMapMemoize
});

const EMPTY_FAVORITE_IDS: string[] = [];

let _prevChannelEntities: unknown;
let _prevCategoryEntities: unknown;
let _prevFavoriteIds: unknown;
let _recomputeCount = 0;

export function getThreadUnreadBehindFromList(
	list: Array<ICategoryChannel | IChannel>,
	channelId: string | undefined,
	threadId: string | undefined
): IChannel[] | undefined {
	if (!threadId) {
		return undefined;
	}
	const index = list.findIndex((c) => c.id === threadId);
	if (index === -1) {
		return undefined;
	}
	return list.slice(index + 1).filter((channel) => (channel as IChannel)?.parent_id === channelId);
}

export const selectListChannelRenderByClanId = createCachedSelector(
	[
		(_state: RootState, clanId?: string) => clanId,
		(state: RootState, clanId?: string) => (clanId ? selectChannelEntityStateByClanId(state, clanId) : undefined),
		(state: RootState, clanId?: string) => (clanId ? selectCategoryEntityStateByClanId(state, clanId) : undefined),
		(state: RootState, clanId?: string) => (clanId ? (selectFavoriteChannelsByClanId(state, clanId) ?? EMPTY_FAVORITE_IDS) : EMPTY_FAVORITE_IDS)
	],
	(clanId, channelEntities, categoryEntities, favoriteIds) => {
		if (!clanId || !channelEntities) {
			return undefined;
		}
		const hasChannels = channelEntities.ids.length > 0;
		const hasCategories = (categoryEntities?.ids?.length ?? 0) > 0;
		if (!hasChannels || !hasCategories) {
			return undefined;
		}
		const channels = channelEntities.ids.map((id) => channelEntities.entities[id]).filter(Boolean) as ChannelsEntity[];
		const categoriesList = categoryEntities
			? (categoryEntities.ids.map((id) => categoryEntities.entities[id]).filter(Boolean) as CategoriesEntity[])
			: [];
		const sortedCategories = sortCategoriesByOrder(categoriesList);

		_recomputeCount += 1;
		_prevChannelEntities = channelEntities;
		_prevCategoryEntities = categoryEntities;
		_prevFavoriteIds = favoriteIds;

		return buildListChannelRender({
			listChannel: channels as IChannel[],
			listCategory: sortedCategories,
			clanId,
			listChannelFavor: favoriteIds
		});
	}
);

export const selectAllThreadUnreadBehind = createCachedSelector(
	[
		selectListChannelRenderByClanId,
		(_state: RootState, clanId?: string) => clanId,
		(_state: RootState, _clanId?: string, channelId?: string) => channelId,
		(_state: RootState, _clanId?: string, _channelId?: string, threadId?: string) => threadId
	],
	(list, _clanId, channelId, threadId) => getThreadUnreadBehindFromList(list ?? [], channelId, threadId)
);

export type ListChannelRenderRow = ICategoryChannel | IChannel;
