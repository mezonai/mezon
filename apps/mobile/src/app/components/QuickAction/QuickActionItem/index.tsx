import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { QUICK_MENU_TYPE, QuickMenuType } from '@mezon/utils';
import { ApiQuickMenuAccess } from 'mezon-js/api.gen';
import { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface QuickActionItemProps {
	item: ApiQuickMenuAccess;
	themeValue: Attributes;
	openModal: (item: ApiQuickMenuAccess) => void;
	handleDelete: (id: string, item: ApiQuickMenuAccess) => void;
	selectedTab: QuickMenuType;
}

export const QuickActionItem = memo(({ item, themeValue, openModal, handleDelete, selectedTab }: QuickActionItemProps) => {
	const styles = style(themeValue);
	const menuName = useMemo(() => {
		return selectedTab === QUICK_MENU_TYPE.FLASH_MESSAGE ? `/${item?.menu_name}` : item?.menu_name;
	}, [selectedTab, item?.menu_name]);

	return (
		<View style={styles.item}>
			<View style={styles.contentContainer}>
				<View style={styles.keyContainer}>
					<Text style={styles.keyText}>{menuName}</Text>
				</View>
				<Text numberOfLines={1} style={styles.valueText}>
					{item?.action_msg}
				</Text>
			</View>
			<TouchableOpacity onPress={() => openModal(item)}>
				<MezonIconCDN icon={IconCDN.editAction} height={size.s_20} width={size.s_30} color={themeValue.textStrong} />
			</TouchableOpacity>
			<TouchableOpacity onPress={() => handleDelete(item?.id, item)}>
				<MezonIconCDN icon={IconCDN.deleteAction} height={size.s_20} width={size.s_20} color={baseColor.red} />
			</TouchableOpacity>
		</View>
	);
});
