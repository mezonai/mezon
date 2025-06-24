import { usePermissionChecker } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentUserId, selectMemberClanByUserId2, soundEffectActions, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { EPermission, createImgproxyUrl } from '@mezon/utils';
import { ClanSticker } from 'mezon-js';
import { Ref, forwardRef, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Sound from 'react-native-sound';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
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
	return prevProps.isPlaying === nextProps.isPlaying && prevProps.item?.id === nextProps.item?.id;
};

const SoundItemComponent = forwardRef(({ item, onSwipeOpen, isPlaying = false, onPressPlay }: ServerDetailProps, ref: Ref<SwipeableMethods>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanEmojiSetting']);
	const dispatch = useAppDispatch();
	const dataAuthor = useAppSelector((state) => selectMemberClanByUserId2(state, item.creator_id ?? ''));
	const currentUserId = useAppSelector(selectCurrentUserId);
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const hasDeleteOrEditPermission = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission || currentUserId === item.creator_id;
	}, [hasAdminPermission, isClanOwner, hasManageClanPermission, currentUserId, item.creator_id]);

	const handleDeleteSound = async () => {
		try {
			await dispatch(
				soundEffectActions.deleteSound({
					soundId: item?.id,
					clan_id: item?.clan_id,
					soundLabel: item?.shortname
				})
			);

			dispatch(soundEffectActions.fetchSoundByUserId({ noCache: true }));
		} catch (error) {
			console.error('Error deleting sound:', error);
		}
	};

	const handleSwipableWillOpen = () => {
		onSwipeOpen(item);
	};

	const handlePressPlay = () => {
		onPressPlay?.(item);
	};

	const RightAction = () => {
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

	return (
		<Swipeable ref={ref} onSwipeableWillOpen={handleSwipableWillOpen} enabled={hasDeleteOrEditPermission} renderRightActions={RightAction}>
			<Pressable style={styles.container} onPress={handlePressPlay}>
				<Pressable style={styles.audioPlay} onPress={handlePressPlay} disabled={!item?.source}>
					{isPlaying ? (
						<MezonIconCDN icon={IconCDN.channelVoice} width={size.s_20} height={size.s_20} color={themeValue.text} />
					) : (
						<MezonIconCDN icon={IconCDN.playCircleIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
					)}
				</Pressable>
				<View style={styles.emojiItem}>
					<View style={styles.emojiName}>
						<Text style={styles.lightTitle} numberOfLines={1} ellipsizeMode="tail">
							{item?.shortname}
						</Text>
					</View>
				</View>
				{dataAuthor?.user?.avatar_url && (
					<View style={styles.user}>
						<Text numberOfLines={1} style={styles.title}>
							{dataAuthor?.user?.username}
						</Text>
						{dataAuthor?.user?.avatar_url ? (
							<FastImage
								source={{
									uri: createImgproxyUrl(dataAuthor?.user?.avatar_url ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								style={styles.imgWrapper}
							/>
						) : (
							<View
								style={{
									backgroundColor: themeValue.colorAvatarDefault,
									overflow: 'hidden',
									width: size.s_30,
									height: size.s_30,
									borderRadius: size.s_30,
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								<Text style={styles.textAvatar}>{dataAuthor?.user?.username?.charAt?.(0)?.toUpperCase()}</Text>
							</View>
						)}
					</View>
				)}
			</Pressable>
		</Swipeable>
	);
});

export const SoundItem = memo(SoundItemComponent, areEqual);
