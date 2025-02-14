import { usePermissionChecker } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { emojiSuggestionActions, selectCurrentUserId, selectMemberClanByUserId2, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { EPermission, createImgproxyUrl } from '@mezon/utils';
import { ClanEmoji } from 'mezon-js';
import { MezonUpdateClanEmojiByIdBody } from 'mezon-js/api.gen';
import { Ref, forwardRef, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Toast from 'react-native-toast-message';
import { style } from './styles';

type ServerDetailProps = {
	item: ClanEmoji;
	onSwipeOpen?: (item: ClanEmoji) => void;
};

export const EmojiDetail = forwardRef(({ item, onSwipeOpen }: ServerDetailProps, ref: Ref<SwipeableMethods>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanEmojiSetting']);
	const dispatch = useAppDispatch();
	const dataAuthor = useAppSelector((state) => selectMemberClanByUserId2(state, item.creator_id ?? ''));
	const [emojiName, setEmojiName] = useState(item.shortname?.split(':')?.join(''));
	const [isFocused, setIsFocused] = useState(false);
	const textInputRef = useRef<TextInput>(null);
	const currentUserId = useAppSelector(selectCurrentUserId);
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const hasDeleteOrEditPermission = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission || currentUserId === item.creator_id;
	}, [hasAdminPermission, isClanOwner, hasManageClanPermission, currentUserId, item.creator_id]);

	const handleUpdateEmoji = async () => {
		const request: MezonUpdateClanEmojiByIdBody = {
			source: item.src,
			shortname: emojiName,
			category: item.category,
			clan_id: item.clan_id
		};
		await dispatch(emojiSuggestionActions.updateEmojiSetting({ request: request, emojiId: item.id || '' }));
	};

	const handleDeleteEmoji = async () => {
		dispatch(emojiSuggestionActions.deleteEmojiSetting({ emoji: item, clan_id: item.clan_id as string, label: item.shortname }));
	};

	const focusTextInput = () => {
		if (!hasDeleteOrEditPermission) {
			return;
		}
		setIsFocused(true);
		if (textInputRef) {
			textInputRef.current.focus();
		}
	};

	const handleSwipableWillOpen = () => {
		onSwipeOpen(item);
	};

	const handleBlur = () => {
		setIsFocused(false);
		if (!emojiName) {
			setEmojiName(item.shortname?.split(':')?.join(''));
		} else if (!hasDeleteOrEditPermission && emojiName !== item.shortname?.split(':')?.join('')) {
			setEmojiName(item.shortname?.split(':')?.join(''));
			Toast.show({
				type: 'info',
				text1: t('toast.reject')
			});
		} else if (emojiName !== item.shortname?.split(':')?.join('')) {
			handleUpdateEmoji();
		}
	};

	const handleFocus = () => {
		setIsFocused(true);
	};

	const RightAction = () => {
		return (
			<View style={styles.rightItem}>
				<TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEmoji}>
					<Icons.TrashIcon width={size.s_20} height={size.s_20} color={baseColor.white} />
					<Text style={styles.deleteText}>{t('emojiList.delete')}</Text>
				</TouchableOpacity>
			</View>
		);
	};

	return (
		<Swipeable ref={ref} onSwipeableWillOpen={handleSwipableWillOpen} enabled={hasDeleteOrEditPermission} renderRightActions={RightAction}>
			<Pressable style={styles.container} onPress={focusTextInput}>
				<View style={styles.emojiItem}>
					<FastImage style={styles.emoji} resizeMode={'contain'} source={{ uri: item.src }} />
					<View style={styles.emojiName}>
						{!isFocused && <Text style={styles.whiteText}>:</Text>}
						<TextInput
							editable={hasDeleteOrEditPermission}
							ref={textInputRef}
							onBlur={handleBlur}
							onFocus={handleFocus}
							numberOfLines={1}
							style={[styles.lightTitle]}
							value={emojiName}
							onChangeText={setEmojiName}
						/>
						{!isFocused && <Text style={styles.whiteText}>:</Text>}
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
