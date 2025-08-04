import { size } from '@mezon/mobile-ui';
import { QuickMenuType } from '@mezon/utils';
import { ApiQuickMenuAccess } from 'mezon-js/api.gen';
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { EmptyQuickAction } from '../QuickActionEmpty';
import { QuickActionItem } from '../QuickActionItem';

interface QuickActionListProps {
    data: ApiQuickMenuAccess[];
    themeValue: any;
    openModal: (item: ApiQuickMenuAccess) => void;
    handleDelete: (id: string, item: ApiQuickMenuAccess) => void;
    selectedTab: QuickMenuType;
}

export const QuickActionList = React.memo(({
    data,
    themeValue,
    openModal,
    handleDelete,
    selectedTab
}: QuickActionListProps) => {

    const renderItem = useCallback(({ item }: { item: ApiQuickMenuAccess }) => (
        <QuickActionItem
            item={item}
            themeValue={themeValue}
            openModal={openModal}
            handleDelete={handleDelete}
            selectedTab={selectedTab}
        />
    ), [themeValue, openModal, handleDelete, selectedTab]);

    const keyExtractor = useCallback((item: ApiQuickMenuAccess) => item?.id, []);

    const ListEmptyComponent = useCallback(() => (
        <EmptyQuickAction selectedTab={selectedTab} />
    ), [selectedTab]);

    return (
        <FlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={ListEmptyComponent}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({
                length: size.s_70,
                offset: size.s_70 * index,
                index,
            })}
        />
    );
}); 