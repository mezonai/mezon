import { categoriesActions, selectAllCategories, selectCategoryIdSortChannel, selectChannelThreads, useAppDispatch } from '@mezon/store';
import { ICategoryChannel, IChannel } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export function useCategory() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const categorizedChannels = useCategorizedChannels();
	const handleDeleteCategory = useCallback(
		async ({ category, currenChannel }: { category: ICategoryChannel; currenChannel: IChannel }) => {
			const toChannelPage = (channelId: string, clanId: string) => {
				if (channelId) return `/chat/clans/${clanId}/channels/${channelId}`;
				return `/chat/clans/${clanId}`;
			};
			const toMembersPage = (clanId: string) => {
				return `/chat/clans/${clanId}/member-safety`;
			};
			await dispatch(
				categoriesActions.deleteCategory({
					clanId: category.clan_id as string,
					categoryId: category.id as string,
					categoryLabel: category.category_name as string
				})
			);
			if (currenChannel.category_id === category.category_id) {
				const linkPageMember = toMembersPage(category.clan_id || '');
				navigate(linkPageMember);
			}
		},
		[categorizedChannels]
	);

	return useMemo(
		() => ({
			categorizedChannels,
			handleDeleteCategory
		}),
		[categorizedChannels, handleDeleteCategory]
	);
}

export function useCategorizedAllChannels() {
	const listChannels = useSelector(selectChannelThreads);
	const categories = useSelector(selectAllCategories);
	const categoryIdSortChannel = useSelector(selectCategoryIdSortChannel);

	const categorizedChannels = useMemo(() => {
		const listChannelRender: (ICategoryChannel | IChannel)[] = [];
		categories.map((category) => {
			const categoryChannels = listChannels.filter((channel) => channel && channel.category_id === category.id) as IChannel[];
			const listChannelIds = categoryChannels.map((channel) => channel.id);
			const channelSort = sortChannels(categoryChannels);

			const categoryWithChannels: ICategoryChannel = {
				...category,
				channels: listChannelIds
			};

			listChannelRender.push(categoryWithChannels);
			channelSort.forEach((channel) => listChannelRender.push(channel));
		});

		return listChannelRender;
	}, [categories, listChannels, categoryIdSortChannel]);

	return categorizedChannels;
}

export function useCategorizedChannels() {
	const listChannels = useSelector(selectChannelThreads);
	const categories = useSelector(selectAllCategories);
	const categoryIdSortChannel = useSelector(selectCategoryIdSortChannel);

	const categorizedChannels = useMemo(() => {
		const results = categories.map((category) => {
			const categoryChannels = listChannels.filter((channel) => channel && channel?.category_id === category.id) as IChannel[];

			if (category.category_id && categoryIdSortChannel[category.category_id]) {
				categoryChannels.sort((a, b) => {
					if (a.channel_label && b.channel_label) {
						return b.channel_label.localeCompare(a.channel_label);
					}
					return 0;
				});
			}

			return {
				...category,
				channels: categoryChannels
			};
		});

		return results as ICategoryChannel[];
	}, [categories, listChannels, categoryIdSortChannel]);

	return categorizedChannels;
}

function sortChannels(channels: IChannel[]): IChannel[] {
	const channelMap = new Map<string, IChannel>();
	const sortedChannels: IChannel[] = [];

	// Create a map of channels by their id
	channels.forEach((channel) => {
		channelMap.set(channel.id, channel);
	});

	// Use forEach to sort channels
	channels.forEach((channel) => {
		if (!channel.parent_id || channel.parent_id === '0') {
			sortedChannels.push(channel);
			addChildren(channel, sortedChannels);
		}
	});

	function addChildren(parent: IChannel, acc: IChannel[]) {
		channels
			.filter((child) => child.parent_id === parent.id)
			.forEach((child) => {
				acc.push(child);
				addChildren(child, acc);
			});
	}

	return sortedChannels;
}
