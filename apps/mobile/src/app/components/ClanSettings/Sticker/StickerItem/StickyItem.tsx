import { useClanRestriction } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { deleteSticker, selectMemberClanByUserId2, updateSticker, useAppDispatch } from '@mezon/store';
import { selectCurrentUserId, useAppSelector } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { ClanSticker } from 'mezon-js';
import { Ref, forwardRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Toast from 'react-native-toast-message';
import { MezonAvatar } from '../../../../componentUI';
import { style } from './styles';

interface IStickerItem {
	data: ClanSticker;
	onSwipeOpen?: (item: ClanSticker) => void;
	clanID: string;
}

export const StickerSettingItem = forwardRef(({ data, clanID, onSwipeOpen }: IStickerItem, ref: Ref<SwipeableMethods>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, data.creator_id));
	const [stickerName, setStickerName] = useState<string>(data.shortname);
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['clanStickerSetting']);
	const currentUserId = useAppSelector(selectCurrentUserId);

	const [hasAdminPermission, { isClanOwner }] = useClanRestriction([EPermission.administrator]);
	const [hasManageClanPermission] = useClanRestriction([EPermission.manageClan]);
	const hasDeleteOrEditPermission = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission || currentUserId === data.creator_id;
	}, [hasAdminPermission, isClanOwner, hasManageClanPermission, currentUserId, data.creator_id]);

	const [sticker, setSticker] = useState({
		shortname: data.shortname ?? '',
		source: data.source ?? '',
		id: data.id ?? '0',
		category: data.category ?? ''
	});

	const renderRightAction = () => {
		return (
			<View style={styles.rightItem}>
				<TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSticker}>
					<Icons.TrashIcon width={size.s_20} height={size.s_20} color={baseColor.white} />
					<Text style={styles.deleteText}>{t('btn.delete')}</Text>
				</TouchableOpacity>
			</View>
		);
	};

	const handleSwipeOpen = () => {
		onSwipeOpen(data);
	};

	const handleDeleteSticker = useCallback(async () => {
		if (data.id) {
			const result = (await dispatch(
				deleteSticker({
					stickerId: data.id,
					clan_id: clanID,
					stickerLabel: ''
				})
			)) as any;
			if (result?.error) {
				Toast.show({
					type: 'error',
					text1: t('toast.errorUpdating')
				});
			}
		}
	}, []);

	const handleUpdateSticker = useCallback(async () => {
		if (sticker && sticker.id && stickerName !== sticker.shortname) {
			setSticker({
				...sticker,
				shortname: stickerName
			});

			const result = (await dispatch(
				updateSticker({
					stickerId: sticker?.id ?? '',
					request: {
						...sticker,
						clan_id: clanID,
						shortname: stickerName
					}
				})
			)) as any;
			if (result?.error) {
				Toast.show({
					type: 'error',
					text1: t('toast.errorUpdating')
				});
			}
			return;
		}
	}, [sticker, stickerName]);

	return (
		<Swipeable ref={ref} renderRightActions={renderRightAction} onSwipeableWillOpen={handleSwipeOpen} enabled={hasDeleteOrEditPermission}>
			<View style={styles.container}>
				<View style={styles.flexRow}>
					<FastImage source={{ uri: data.source }} style={{ height: size.s_40, width: size.s_40 }} />

					<TextInput
						value={stickerName}
						style={{ color: themeValue.text }}
						onChangeText={setStickerName}
						onBlur={handleUpdateSticker}
						editable={hasDeleteOrEditPermission}
					/>
				</View>

				<View style={styles.flexRow}>
					<Text style={styles.text}>{user?.user?.username}</Text>
					<MezonAvatar height={size.s_30} width={size.s_30} avatarUrl={user?.user?.avatar_url} username={user?.user?.username} />
				</View>
			</View>
		</Swipeable>
	);
});
