/* eslint-disable @nx/enforce-module-boundaries */
import { usePermissionChecker } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentUserId, selectMemberClanByUserId, soundEffectActions, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import type { ClanSticker } from 'mezon-js';
import type { Ref } from 'react';
import { forwardRef, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Sound from 'react-native-sound';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { Icons } from '../../../../componentUI/MobileIcons';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

type ServerDetailProps = {
	item: ClanSticker;
	onSwipeOpen?: (item: ClanSticker) => void;
	isPlaying?: boolean;
	onPressPlay?: (item: ClanSticker) => void;
};

Sound.setCategory('Playback');

const areEqual = (prevProps: ServerDetailProps, nextProps: ServerDetailProps) => {
	return prevProps?.isPlaying === nextProps?.isPlaying && prevProps?.item?.id === nextProps?.item?.id;
};

const SoundItemComponent = forwardRef(({ item, onSwipeOpen, isPlaying = false, onPressPlay }: ServerDetailProps, ref: Ref<SwipeableMethods>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanEmojiSetting']);
	const dispatch = useAppDispatch();
	const dataAuthor = useAppSelector((state) => selectMemberClanByUserId(state, item?.creator_id ?? ''));
	const currentUserId = useAppSelector(selectCurrentUserId);
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const hasDeleteOrEditPermission = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission || currentUserId === item?.creator_id;
	}, [hasAdminPermission, isClanOwner, hasManageClanPermission, currentUserId, item?.creator_id]);

	const authorDisplayName = useMemo(() => {
		return dataAuthor?.clan_nick || dataAuthor?.user?.display_name || dataAuthor?.user?.username || '';
	}, [dataAuthor?.clan_nick, dataAuthor?.user?.display_name, dataAuthor?.user?.username]);

	const authorAvatarUrl = useMemo(() => {
		return dataAuthor?.clan_avatar || dataAuthor?.user?.avatar_url || '';
	}, [dataAuthor?.clan_avatar, dataAuthor?.user?.avatar_url]);

	const handleDeleteSound = async () => {
		try {
			await dispatch(
				soundEffectActions.deleteSound({
					soundId: item?.id || '',
					clan_id: item?.clan_id || '0',
					soundLabel: item?.shortname || ''
				})
			);
		} catch (error) {
			console.error('Error deleting sound:', error);
		}
	};

	const handleSwipableWillOpen = useCallback(() => {
		onSwipeOpen(item);
	}, []);

	const handlePressPlay = () => {
		onPressPlay && onPressPlay(item);
	};

	const renderRightAction = () => {
		if (!hasDeleteOrEditPermission) {
			return null;
		}
		return (
			<View style={styles.rightItem}>
				<TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSound}>
					<MezonIconCDN icon={IconCDN.trashIcon} width={size.s_20} height={size.s_20} color={baseColor.white} />
					<Text style={styles.deleteText}>{t('emojiList.delete')}</Text>
				</TouchableOpacity>
			</View>
		);
	};

	const renderPlayAction = () => {
		return (
			<Pressable style={styles.audioPlay} onPress={handlePressPlay} disabled={!item?.source}>
				{isPlaying ? (
					<Icons.VoiceIcon color={themeValue.text} width={size.s_20} height={size.s_20} />
				) : (
					<MezonIconCDN icon={IconCDN.playCircleIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				)}
			</Pressable>
		);
	};

	return (
		<Swipeable ref={ref} onSwipeableWillOpen={handleSwipableWillOpen} enabled={hasDeleteOrEditPermission} renderRightActions={renderRightAction}>
			<Pressable style={styles.container} onPress={handlePressPlay}>
				{renderPlayAction()}
				<View style={styles.emojiItem}>
					<View style={styles.emojiName}>
						<Text style={styles.lightTitle} numberOfLines={1}>
							{item?.shortname || ''}
						</Text>
					</View>
				</View>

				<View style={styles.user}>
					<Text numberOfLines={1} style={styles.title}>
						{authorDisplayName}
					</Text>
					<View style={styles.imgWrapper}>
						<MezonClanAvatar alt={dataAuthor?.user?.username || ''} image={authorAvatarUrl} />
					</View>
				</View>
			</Pressable>
		</Swipeable>
	);
});

export const SoundItem = memo(SoundItemComponent, areEqual);
