import { baseColor, size } from '@mezon/mobile-ui';
import { QUICK_MENU_TYPE, QuickMenuType } from '@mezon/utils';
import { ApiQuickMenuAccess } from 'mezon-js/api.gen';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface QuickActionItemProps {
    item: ApiQuickMenuAccess;
    themeValue: any;
    openModal: (item: ApiQuickMenuAccess) => void;
    handleDelete: (id: string, item: ApiQuickMenuAccess) => void;
    selectedTab: QuickMenuType;
}

export const QuickActionItem = React.memo(({
    item,
    themeValue,
    openModal,
    handleDelete,
    selectedTab
}: QuickActionItemProps) => {
    const menuName = selectedTab === QUICK_MENU_TYPE.FLASH_MESSAGE ? `/${item.menu_name}` : item.menu_name;

    return (
        <View style={style(themeValue).item}>
            <View style={{ flex: 1 }}>
                <View style={style(themeValue).keyContainer}>
                    <Text style={style(themeValue).keyText}>{menuName}</Text>
                </View>
                <Text numberOfLines={1} style={style(themeValue).valueText}>
                    {item.action_msg}
                </Text>
            </View>
            <TouchableOpacity onPress={() => openModal(item)}>
                <MezonIconCDN icon={IconCDN.editAction} height={size.s_20} width={size.s_30} color={themeValue.textStrong} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item)}>
                <MezonIconCDN icon={IconCDN.deleteAction} height={size.s_20} width={size.s_20} color={baseColor.red} />
            </TouchableOpacity>
        </View>
    );
}); 