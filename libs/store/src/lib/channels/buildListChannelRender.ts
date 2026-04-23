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

function sortByOptionalOrder(items: IChannel[]): IChannel[] {
	if (!items.length) return items;
	let hasOrder = false;
	for (let i = 0; i < items.length; i++) {
		if (readOrder(items[i]) != null) {
			hasOrder = true;
			break;
		}
	}
	if (!hasOrder) return items;
	const sorted = new Array<IChannel>(items.length);
	for (let i = 0; i < items.length; i++) sorted[i] = items[i];
	sorted.sort((a, b) => {
		const ao = readOrder(a);
		const bo = readOrder(b);
		if (ao != null || bo != null) {
			return (ao ?? Number.MAX_SAFE_INTEGER) - (bo ?? Number.MAX_SAFE_INTEGER);
		}
		const aId = a.channel_id ?? '';
		const bId = b.channel_id ?? '';
		return aId < bId ? -1 : aId > bId ? 1 : 0;
	});
	return sorted;
}

function isParentChannel(ch: IChannel): boolean {
	const pid = ch.parent_id ?? '';
	return pid === '0' || pid === '';
}

export function partitionChannelsForRender(channels: IChannel[]): { parents: IChannel[]; threadSlice: IChannel[] } {
	const parents: IChannel[] = [];
	const threadSlice: IChannel[] = [];
	for (let i = 0; i < channels.length; i++) {
		const ch = channels[i];
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
	for (let i = 0; i < threadSlice.length; i++) {
		const t = threadSlice[i];
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
	for (let i = 0; i < parents.length; i++) {
		const p = parents[i];
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
	const parentsSorted = sortByOptionalOrder(parentsForCategory);
	const result: IChannel[] = [];
	for (let i = 0; i < parentsSorted.length; i++) {
		const channel = parentsSorted[i];
		const rawChildren = threadsByParent.get(channel.id);
		if (!rawChildren || rawChildren.length === 0) {
			result.push(channel);
			continue;
		}
		const children = sortByOptionalOrder(rawChildren);
		const threadIds: string[] = channel.threadIds ? channel.threadIds.slice() : [];
		for (let j = 0; j < children.length; j++) {
			threadIds.push(children[j].id);
		}
		const newChannel = { ...channel, threadIds };
		result.push(newChannel);
		for (let j = 0; j < children.length; j++) {
			result.push(children[j]);
		}
	}
	return result;
}

export function prioritizeChannel(channels: IChannel[]): IChannel[] {
	const { parents, threadSlice } = partitionChannelsForRender(channels);
	const out = new Array<IChannel>(parents.length + threadSlice.length);
	let idx = 0;
	for (let i = 0; i < parents.length; i++) out[idx++] = parents[i];
	for (let i = 0; i < threadSlice.length; i++) out[idx++] = threadSlice[i];
	return out;
}

export function sortChannels(channels: IChannel[], categoryId: string): IChannel[] {
	const { parents, threadSlice } = partitionChannelsForRender(channels);
	const threadsByParent = buildThreadsByParent(threadSlice);
	const parentsInCat: IChannel[] = [];
	for (let i = 0; i < parents.length; i++) {
		if (parents[i].category_id === categoryId) parentsInCat.push(parents[i]);
	}
	return flattenCategoryWithThreads(parentsInCat, threadsByParent);
}

export function buildListChannelRender(payload: DataChannelAndCate): Array<ICategoryChannel | IChannel> {
	const { listChannel, listCategory, clanId, listChannelFavor } = payload;
	const { parents, threadSlice } = partitionChannelsForRender(listChannel);
	const threadsByParent = buildThreadsByParent(threadSlice);
	const parentsByCategory = groupParentsByCategoryId(parents);

	const favorIdSet = listChannelFavor.length > 0 ? new Set(listChannelFavor) : null;

	const categoryRows: (ICategoryChannel | IChannel)[] = [];
	const listFavorChannel: IChannel[] = [];

	for (let ci = 0; ci < listCategory.length; ci++) {
		const category = listCategory[ci];
		const parentsInCat = parentsByCategory.get(category.id) ?? [];
		const categoryChannels = flattenCategoryWithThreads(parentsInCat, threadsByParent);

		const listChannelIds = new Array<string>(categoryChannels.length);
		for (let i = 0; i < categoryChannels.length; i++) {
			listChannelIds[i] = categoryChannels[i].id;
		}

		categoryRows.push({
			...category,
			channels: listChannelIds
		} as ICategoryChannel);

		for (let i = 0; i < categoryChannels.length; i++) {
			const channel = categoryChannels[i];
			if (favorIdSet && favorIdSet.has(channel.id)) {
				listFavorChannel.push({
					...channel,
					isFavor: true,
					category_id: FAVORITE_CATEGORY_ID
				});
			}
			categoryRows.push(channel);
		}
	}

	const favorCate: ICategoryChannel = {
		channels: listChannelFavor,
		id: FAVORITE_CATEGORY_ID,
		category_id: FAVORITE_CATEGORY_ID,
		category_name: FAVORITE_CATEGORY_NAME,
		clan_id: clanId,
		creator_id: '0',
		category_order: 1,
		isFavor: true
	} as ICategoryChannel;

	const totalSize = 1 + listFavorChannel.length + categoryRows.length;
	const result = new Array<ICategoryChannel | IChannel>(totalSize);
	result[0] = favorCate;
	for (let i = 0; i < listFavorChannel.length; i++) {
		result[1 + i] = listFavorChannel[i];
	}
	const offset = 1 + listFavorChannel.length;
	for (let i = 0; i < categoryRows.length; i++) {
		result[offset + i] = categoryRows[i];
	}

	return result;
}

export function sortCategoriesByOrder(categories: CategoriesEntity[]): CategoriesEntity[] {
	const sorted = new Array<CategoriesEntity>(categories.length);
	for (let i = 0; i < categories.length; i++) sorted[i] = categories[i];
	sorted.sort((a, b) => {
		const ao = (a as { order?: number }).order ?? 0;
		const bo = (b as { order?: number }).order ?? 0;
		return ao - bo;
	});
	return sorted;
}

export function applyActiveThreadToRows(rows: Array<ICategoryChannel | IChannel>, activeThreadId?: string): Array<ICategoryChannel | IChannel> {
	if (!activeThreadId) {
		return rows;
	}
	const result = new Array<ICategoryChannel | IChannel>(rows.length);
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		if (!isCategoryHeaderRow(row) && (row as IChannel).id === activeThreadId) {
			result[i] = { ...(row as IChannel), active: 1 };
		} else {
			result[i] = row;
		}
	}
	return result;
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
	let catIndex = -1;
	for (let i = 0; i < rows.length; i++) {
		if (isCategoryHeaderRow(rows[i]) && rows[i].id === categoryId) {
			catIndex = i;
			break;
		}
	}
	if (catIndex === -1) {
		return rows;
	}
	let end = catIndex + 1;
	while (end < rows.length && !isCategoryHeaderRow(rows[end])) {
		end++;
	}
	const segment = rows.slice(catIndex + 1, end);
	const byId = new Map<string, ICategoryChannel | IChannel>();
	for (let i = 0; i < segment.length; i++) {
		byId.set((segment[i] as IChannel).id, segment[i]);
	}
	const reordered: typeof segment = [];
	const seen = new Set<string>();
	for (let i = 0; i < orderedRowIds.length; i++) {
		const id = orderedRowIds[i];
		const row = byId.get(id);
		if (row) {
			reordered.push(row);
			seen.add(id);
		}
	}
	for (let i = 0; i < segment.length; i++) {
		const id = (segment[i] as IChannel).id;
		if (!seen.has(id)) {
			reordered.push(segment[i]);
		}
	}
	const result = new Array<ICategoryChannel | IChannel>(catIndex + 1 + reordered.length + (rows.length - end));
	let idx = 0;
	for (let i = 0; i <= catIndex; i++) result[idx++] = rows[i];
	for (let i = 0; i < reordered.length; i++) result[idx++] = reordered[i];
	for (let i = end; i < rows.length; i++) result[idx++] = rows[i];
	return result;
}

export function applySortChannelInCategory(
	rows: Array<ICategoryChannel | IChannel>,
	categoryId: string,
	indexStart: number,
	indexEnd: number
): Array<ICategoryChannel | IChannel> {
	const next = new Array<ICategoryChannel | IChannel>(rows.length);
	for (let i = 0; i < rows.length; i++) next[i] = rows[i];
	const itemOrder = next[indexStart] as IChannel;
	const itemTarget = next[indexEnd] as IChannel;
	const orderId = itemOrder.id;
	const targetId = itemTarget.id;
	const channelThreadOrder: (ICategoryChannel | IChannel)[] = [];
	const channelThreadTarget: (ICategoryChannel | IChannel)[] = [];
	for (let i = 0; i < next.length; i++) {
		const item = next[i];
		const ch = item as IChannel;
		const id = ch.id;
		const pid = ch.parent_id;
		const notFavor = item.category_id !== FAVORITE_CATEGORY_ID;
		if ((id === orderId || pid === orderId) && notFavor) channelThreadOrder.push(item);
		if ((id === targetId || pid === targetId) && notFavor) channelThreadTarget.push(item);
	}

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
	let catIndex = -1;
	for (let i = 0; i < rows.length; i++) {
		if (isCategoryHeaderRow(rows[i]) && rows[i].id === categoryId) {
			catIndex = i;
			break;
		}
	}
	if (catIndex === -1) {
		return [];
	}
	let end = catIndex + 1;
	while (end < rows.length && !isCategoryHeaderRow(rows[end])) {
		end++;
	}
	const count = end - catIndex - 1;
	const ids = new Array<string>(count);
	for (let i = 0; i < count; i++) {
		ids[i] = (rows[catIndex + 1 + i] as IChannel).id;
	}
	return ids;
}
