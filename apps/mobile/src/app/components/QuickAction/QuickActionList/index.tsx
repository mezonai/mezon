import { size } from '@mezon/mobile-ui';
import type { QuickMenuType } from '@mezon/utils';
import type { ApiQuickMenuAccess } from 'mezon-js/types';
import { memo, useCallback } from 'react';
import { FlatList } from 'react-native';
import { EmptyQuickAction } from '../QuickActionEmpty';
import { QuickActionItem } from '../QuickActionItem';

interface IQuickActionListProps {
	data: ApiQuickMenuAccess[];
	themeValue: any;
	openModal: (item: ApiQuickMenuAccess | null) => void;
	handleDelete: (id: string, item: ApiQuickMenuAccess) => void;
	selectedTab: QuickMenuType;
}

export const QuickActionList = memo(({ data, themeValue, openModal, handleDelete, selectedTab }: IQuickActionListProps) => {
	const renderItem = useCallback(
		({ item }: { item: ApiQuickMenuAccess }) => (
			<QuickActionItem item={item} themeValue={themeValue} openModal={openModal} handleDelete={handleDelete} selectedTab={selectedTab} />
		),
		[themeValue, openModal, handleDelete, selectedTab]
	);

	const ListEmptyComponent = useCallback(() => <EmptyQuickAction selectedTab={selectedTab} />, [selectedTab]);

	return (
		<FlatList
			data={data}
			keyExtractor={(item, index) => `item_quick_action_${item?.id}_${item?.menuName}_${index}`}
			renderItem={renderItem}
			ListEmptyComponent={ListEmptyComponent}
			initialNumToRender={10}
			maxToRenderPerBatch={10}
			windowSize={10}
			removeClippedSubviews
			getItemLayout={(_, index) => ({
				length: size.s_70,
				offset: size.s_70 * index,
				index
			})}
		/>
	);
});
