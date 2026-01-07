/* eslint-disable @nx/enforce-module-boundaries */
import { usePermissionChecker } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { deleteSticker, selectCurrentUserId, selectMemberClanByUserId, updateSticker, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import type { ClanSticker } from 'mezon-js';
import type { Ref } from 'react';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Toast from 'react-native-toast-message';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { CLAN_MEDIA_NAME_REGEX, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '../../Emoji/EmojiPreview';
import { style } from './styles';

interface IStickerItem {
	data: ClanSticker;
	onSwipeOpen?: (item: ClanSticker) => void;
	clanID: string;
}

export const StickerSettingItem = forwardRef(({ data, clanID, onSwipeOpen }: IStickerItem, ref: Ref<SwipeableMethods>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const user = useAppSelector((state) => selectMemberClanByUserId(state, data?.creatorId ?? ''));
	const [stickerName, setStickerName] = useState<string>(data?.shortname || '');
	const dispatch = useAppDispatch();
	const { t } = useTranslation(['clanStickerSetting']);
	const currentUserId = useAppSelector(selectCurrentUserId);

	const [sticker, setSticker] = useState({
		shortname: data?.shortname ?? '',
		source: data?.source ?? '',
		id: data?.id ?? '0',
		category: data?.category ?? ''
	});

	const [hasAdminPermission, isClanOwner, hasManageClanPermission] = usePermissionChecker([EPermission.administrator, EPermission.clanOwner]);
	const hasDeleteOrEditPermission = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission || currentUserId === data?.creatorId;
	}, [hasAdminPermission, isClanOwner, hasManageClanPermission, currentUserId, data?.creatorId]);

	const authorDisplayName = useMemo(() => {
		return user?.clanNick || user?.user?.displayName || user?.user?.username || '';
	}, [user?.clanNick, user?.user?.displayName, user?.user?.username]);

	const authorAvatarUrl = useMemo(() => {
		return user?.clanAvatar || user?.user?.avatarUrl || '';
	}, [user?.clanAvatar, user?.user?.avatarUrl]);

	const stickerImageSrc = useMemo(() => {
		return (sticker?.source ? sticker.source : `${process.env.NX_BASE_IMG_URL}/stickers/${sticker?.id}.webp`) || '';
	}, [sticker?.id, sticker.source]);

	const renderRightAction = () => {
		return (
			<View style={styles.rightItem}>
				<TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSticker}>
					<MezonIconCDN icon={IconCDN.trashIcon} width={size.s_20} height={size.s_20} color={baseColor.white} />
					<Text style={styles.deleteText}>{t('btn.delete')}</Text>
				</TouchableOpacity>
			</View>
		);
	};

	const handleSwipeOpen = useCallback(() => {
		onSwipeOpen(data);
	}, []);

	const handleDeleteSticker = useCallback(async () => {
		if (data?.id) {
			const result = (await dispatch(
				deleteSticker({
					stickerId: data?.id || '',
					clanId: clanID || '',
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
		if (sticker && sticker?.id && stickerName !== sticker?.shortname) {
			if (!stickerName) {
				setStickerName(sticker?.shortname);
				return;
			}
			if (!CLAN_MEDIA_NAME_REGEX.test(stickerName) || stickerName?.length < MIN_NAME_LENGTH || stickerName?.length > MAX_NAME_LENGTH) {
				setStickerName(sticker?.shortname);
				Toast.show({
					type: 'error',
					text1: t('toast.validateName', { min: MIN_NAME_LENGTH, max: MAX_NAME_LENGTH })
				});
				return;
			}
			setSticker({
				...sticker,
				shortname: stickerName
			});

			const result = (await dispatch(
				updateSticker({
					stickerId: sticker?.id ?? '',
					request: {
						...sticker,
						clanId: clanID || '',
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
				<View style={styles.stickerItem}>
					<FastImage source={{ uri: stickerImageSrc }} style={styles.stickerImage} />

					<View style={styles.stickerName}>
						<TextInput
							value={stickerName}
							style={styles.lightTitle}
							onChangeText={setStickerName}
							onBlur={handleUpdateSticker}
							editable={hasDeleteOrEditPermission}
						/>
					</View>
				</View>

				<View style={styles.user}>
					<Text style={styles.title} numberOfLines={1}>
						{authorDisplayName}
					</Text>
					<View style={styles.imgWrapper}>
						<MezonClanAvatar alt={user?.user?.username || ''} image={authorAvatarUrl} />
					</View>
				</View>
			</View>
		</Swipeable>
	);
});
