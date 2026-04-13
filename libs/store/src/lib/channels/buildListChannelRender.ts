import type { ICategoryChannel, IChannel } from '@mezon/utils';
import type { CategoriesEntity } from '../categories/categories.slice';

export const FAVORITE_CATEGORY_ID = 'favorCate';
export const FAVORITE_CATEGORY_NAME = 'favoriteChannel';
export const PUBLIC_CHANNELS_NAME = 'PUBLIC CHANNELS';

export interface DataChannelAndCate {
	listChannel: IChannel[];
	listCategory: CategoriesEntity[];
	clanId: string;
	listChannelFavor: string[];
	isMobile?: boolean;
}

type WithOrder = { order?: number };

function readOrder(ch: IChannel): number | undefined {
	return (ch as WithOrder).order;
}

function sortParentsByOptionalOrder(parentsInCategory: IChannel[]): IChannel[] {
	if (!parentsInCategory.length) {
		return parentsInCategory;
	}
	const hasOrder = parentsInCategory.some((p) => readOrder(p) != null);
	if (!hasOrder) {
		return parentsInCategory;
	}
	return [...parentsInCategory].sort((a, b) => {
		const ao = readOrder(a);
		const bo = readOrder(b);
		if (ao != null || bo != null) {
			return (ao ?? Number.MAX_SAFE_INTEGER) - (bo ?? Number.MAX_SAFE_INTEGER);
		}
		const aId = a.channel_id ?? '';
		const bId = b.channel_id ?? '';
		return aId < bId ? -1 : aId > bId ? 1 : 0;
	});
}

function sortThreadsByOptionalOrder(children: IChannel[] | undefined): IChannel[] {
	if (!children?.length) {
		return children ?? [];
	}
	const hasOrder = children.some((c) => readOrder(c) != null);
	if (!hasOrder) {
		return children;
	}
	return [...children].sort((a, b) => {
		const ao = readOrder(a);
		const bo = readOrder(b);
		if (ao != null || bo != null) {
			return (ao ?? Number.MAX_SAFE_INTEGER) - (bo ?? Number.MAX_SAFE_INTEGER);
		}
		const aId = a.channel_id ?? '';
		const bId = b.channel_id ?? '';
		return aId < bId ? -1 : aId > bId ? 1 : 0;
	});
}

function isParentChannel(ch: IChannel): boolean {
	const pid = ch.parent_id ?? '';
	return pid === '0' || pid === '';
}

export function partitionChannelsForRender(channels: IChannel[]): { parents: IChannel[]; threadSlice: IChannel[] } {
	const parents: IChannel[] = [];
	const threadSlice: IChannel[] = [];
	for (const ch of channels) {
		if (isParentChannel(ch)) {
			parents.push(ch);
		} else {
			threadSlice.push(ch);
		}
	}
	parents.sort((a, b) => {
		const aId = a.channel_id ?? '';
		const bId = b.channel_id ?? '';
		return aId < bId ? -1 : aId > bId ? 1 : 0;
	});
	threadSlice.sort((a, b) => {
		const aPid = a.parent_id ?? '';
		const bPid = b.parent_id ?? '';
		return aPid < bPid ? -1 : aPid > bPid ? 1 : 0;
	});
	return { parents, threadSlice };
}

export function partitionParentsAndThreads(prioritized: IChannel[]): { parents: IChannel[]; threadSlice: IChannel[] } {
	return partitionChannelsForRender(prioritized);
}

export function buildThreadsByParent(threadSlice: IChannel[]): Map<string, IChannel[]> {
	const threadsByParent = new Map<string, IChannel[]>();
	for (const t of threadSlice) {
		const pid = t.parent_id || '';
		let list = threadsByParent.get(pid);
		if (!list) {
			list = [];
			threadsByParent.set(pid, list);
		}
		list.push(t);
	}
	return threadsByParent;
}

export function groupParentsByCategoryId(parents: IChannel[]): Map<string, IChannel[]> {
	const map = new Map<string, IChannel[]>();
	for (const p of parents) {
		const cid = p.category_id as string;
		let arr = map.get(cid);
		if (!arr) {
			arr = [];
			map.set(cid, arr);
		}
		arr.push(p);
	}
	return map;
}

export function flattenCategoryWithThreads(parentsForCategory: IChannel[], threadsByParent: Map<string, IChannel[]>): IChannel[] {
	const parentsSorted = sortParentsByOptionalOrder(parentsForCategory);
	const sortedChannels: IChannel[] = [];
	for (const channel of parentsSorted) {
		const newChannel = { ...channel };
		sortedChannels.push(newChannel);
		const rawChildren = threadsByParent.get(channel.id);
		const children = sortThreadsByOptionalOrder(rawChildren);
		if (children?.length) {
			for (const thread of children) {
				sortedChannels.push(thread);
				if (newChannel.threadIds) {
					newChannel.threadIds = [...newChannel.threadIds, thread.id];
				} else {
					newChannel.threadIds = [thread.id];
				}
			}
		}
	}
	return sortedChannels;
}

export function prioritizeChannel(channels: IChannel[]): IChannel[] {
	const { parents, threadSlice } = partitionChannelsForRender(channels);
	return [...parents, ...threadSlice];
}

export function sortChannels(channels: IChannel[], categoryId: string): IChannel[] {
	const { parents, threadSlice } = partitionChannelsForRender(channels);
	const threadsByParent = buildThreadsByParent(threadSlice);
	const parentsInCat = parents.filter((p) => p.category_id === categoryId);
	return flattenCategoryWithThreads(parentsInCat, threadsByParent);
}

export function buildListChannelRender(payload: DataChannelAndCate): Array<ICategoryChannel | IChannel> {
	const { listChannel, listCategory, clanId, listChannelFavor } = payload;
	const { parents, threadSlice } = partitionChannelsForRender(listChannel);
	const threadsByParent = buildThreadsByParent(threadSlice);
	const parentsByCategory = groupParentsByCategoryId(parents);
	const favorIdSet = new Set(listChannelFavor);
	const rows: (ICategoryChannel | IChannel)[] = [];
	const listFavorChannel: IChannel[] = [];
	listCategory.forEach((category) => {
		const parentsInCat = parentsByCategory.get(category.id) ?? [];
		const categoryChannels = flattenCategoryWithThreads(parentsInCat, threadsByParent);
		const listChannelIds = categoryChannels.map((channel) => channel.id);
		const categoryWithChannels: ICategoryChannel = {
			...category,
			channels: listChannelIds
		};

		rows.push(categoryWithChannels);
		categoryChannels.forEach((channel) => {
			if (favorIdSet.has(channel.id)) {
				listFavorChannel.push({
					...channel,
					isFavor: true,
					category_id: FAVORITE_CATEGORY_ID
				});
			}
			rows.push(channel);
		});
	});

	const favorCate: ICategoryChannel = {
		channels: listChannelFavor,
		id: FAVORITE_CATEGORY_ID,
		category_id: FAVORITE_CATEGORY_ID,
		category_name: FAVORITE_CATEGORY_NAME,
		clan_id: clanId,
		creator_id: '0',
		category_order: 1,
		isFavor: true
	};

	return [favorCate, ...listFavorChannel, ...rows];
}

export function sortCategoriesByOrder(categories: CategoriesEntity[]): CategoriesEntity[] {
	return [...categories].sort((a, b) => {
		const ao = (a as { order?: number }).order ?? 0;
		const bo = (b as { order?: number }).order ?? 0;
		return ao - bo;
	});
}

export function applyActiveThreadToRows(rows: Array<ICategoryChannel | IChannel>, activeThreadId?: string): Array<ICategoryChannel | IChannel> {
	if (!activeThreadId) {
		return rows;
	}
	return rows.map((row) => {
		if (isCategoryHeaderRow(row)) {
			return row;
		}
		const ch = row as IChannel;
		if (ch.id === activeThreadId) {
			return { ...ch, active: 1 };
		}
		return row;
	});
}

function isCategoryHeaderRow(item: ICategoryChannel | IChannel): item is ICategoryChannel {
	return 'channels' in item && Array.isArray((item as ICategoryChannel).channels);
}

export function applyLocalChannelOrderForCategory(
	rows: Array<ICategoryChannel | IChannel>,
	categoryId: string,
	orderedRowIds: string[]
): Array<ICategoryChannel | IChannel> {
	if (!orderedRowIds.length || categoryId === FAVORITE_CATEGORY_ID) {
		return rows;
	}
	const catIndex = rows.findIndex((r) => isCategoryHeaderRow(r) && r.id === categoryId);
	if (catIndex === -1) {
		return rows;
	}
	let end = catIndex + 1;
	while (end < rows.length && !isCategoryHeaderRow(rows[end])) {
		end++;
	}
	const segment = rows.slice(catIndex + 1, end);
	const byId = new Map(segment.map((s) => [(s as IChannel).id, s] as const));
	const reordered: typeof segment = [];
	const seen = new Set<string>();
	for (const id of orderedRowIds) {
		const row = byId.get(id);
		if (row) {
			reordered.push(row);
			seen.add(id);
		}
	}
	for (const row of segment) {
		const id = (row as IChannel).id;
		if (!seen.has(id)) {
			reordered.push(row);
		}
	}
	return [...rows.slice(0, catIndex + 1), ...reordered, ...rows.slice(end)];
}

export function applySortChannelInCategory(
	rows: Array<ICategoryChannel | IChannel>,
	categoryId: string,
	indexStart: number,
	indexEnd: number
): Array<ICategoryChannel | IChannel> {
	const next = [...rows];
	const itemOrder = next[indexStart] as IChannel;
	const itemTarget = next[indexEnd] as IChannel;
	const channelThreadOrder = next.filter((item) => {
		if (((item as IChannel).id === itemOrder.id || (item as IChannel).parent_id === itemOrder.id) && item.category_id !== FAVORITE_CATEGORY_ID) {
			return true;
		}
		return false;
	});
	const channelThreadTarget = next.filter((item) => {
		if (
			((item as IChannel).id === itemTarget.id || (item as IChannel).parent_id === itemTarget.id) &&
			item.category_id !== FAVORITE_CATEGORY_ID
		) {
			return true;
		}
		return false;
	});

	if (categoryId !== FAVORITE_CATEGORY_ID) {
		next.splice(indexStart, channelThreadOrder.length);
		next.splice(
			indexStart < indexEnd ? indexEnd - channelThreadOrder.length + channelThreadTarget.length : indexEnd + channelThreadTarget.length,
			0,
			...channelThreadOrder
		);
	} else {
		next.splice(indexStart, 1);
		next.splice(indexStart < indexEnd ? indexEnd : indexEnd + 1, 0, itemOrder);
	}
	return next;
}

export function extractChannelRowIdsForCategory(rows: Array<ICategoryChannel | IChannel>, categoryId: string): string[] {
	const catIndex = rows.findIndex((r) => isCategoryHeaderRow(r) && r.id === categoryId);
	if (catIndex === -1) {
		return [];
	}
	let end = catIndex + 1;
	while (end < rows.length && !isCategoryHeaderRow(rows[end])) {
		end++;
	}
	return rows.slice(catIndex + 1, end).map((r) => (r as IChannel).id);
}
