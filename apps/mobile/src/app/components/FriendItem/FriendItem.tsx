import { useMemberStatus } from '@mezon/core';
import { CallIcon, CheckIcon, CloseIcon, MessageIcon } from '@mezon/mobile-components';
import { Colors, useTheme } from '@mezon/mobile-ui';
import { FriendsEntity } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import React, { useMemo } from 'react';
import { Image, Pressable, Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox/build/dist/BouncyCheckbox';
import FastImage from 'react-native-fast-image';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { UserStatus } from '../UserStatus';
import { style } from './styles';

export enum EFriendItemAction {
	Call,
	Delete,
	Approve,
	MessageDetail,
	ShowInformation
}

export interface IFriendItem {
	friend: FriendsEntity;
	showAction?: boolean;
	selectMode?: boolean;
	isChecked?: boolean;
	disabled?: boolean;
	onSelectChange?: (item: FriendsEntity, isChecked: boolean) => void;
	handleFriendAction: (friend: FriendsEntity, action: EFriendItemAction) => void;
}

export const FriendItem = React.memo(
	({ friend, handleFriendAction, onSelectChange, isChecked, disabled = false, showAction = true, selectMode = false }: IFriendItem) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const userStatus = useMemberStatus(friend.id || '');

		const isFriend = friend.state === 0;
		const isSentRequestFriend = friend.state === 1;
		const isPendingFriendRequest = [1, 2].includes(friend.state);
		const isTabletLandscape = useTabletLandscape();

		const onPressAction = (actionType: EFriendItemAction) => {
			if (selectMode) {
				if (disabled) return;
				onSelectChange(friend, !isChecked);
				return;
			}
			handleFriendAction(friend, actionType);
		};

		const onLongPress = () => {
			handleFriendAction(friend, EFriendItemAction.ShowInformation);
		};

		const isShowDisplayName = useMemo(() => {
			return (isPendingFriendRequest || !showAction) && friend?.user?.display_name;
		}, [friend?.user?.display_name, isPendingFriendRequest, showAction]);

		return (
			<TouchableOpacity
				disabled={disabled}
				style={styles.userItem}
				onPress={() => onPressAction(showAction ? EFriendItemAction.ShowInformation : EFriendItemAction.MessageDetail)}
				onLongPress={() => onLongPress()}
			>
				<View style={styles.avatarWrapper}>
					{friend?.user?.avatar_url ? (
						isTabletLandscape ? (
							<Image
								source={{
									uri: createImgproxyUrl(friend?.user?.avatar_url ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								style={[styles.friendAvatar, disabled && styles.avatarDisabled]}
							/>
						) : (
							<FastImage
								source={{
									uri: createImgproxyUrl(friend?.user?.avatar_url ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								style={[styles.friendAvatar, disabled && styles.avatarDisabled]}
							/>
						)
					) : (
						<View style={styles.wrapperTextAvatar}>
							<Text style={[styles.textAvatar, disabled && styles.avatarDisabled]}>
								{friend?.user?.username?.charAt?.(0)?.toUpperCase()}
							</Text>
						</View>
					)}
					{!isPendingFriendRequest ? <UserStatus status={userStatus} /> : null}
				</View>
				<View style={styles.fill}>
					<View style={styles.friendItemContent}>
						<View>
							{isShowDisplayName ? (
								<Text style={[styles.defaultText, (isPendingFriendRequest || !showAction) && styles.whiteText]}>
									{friend?.user?.display_name}
								</Text>
							) : null}
							<Text style={[styles.defaultText, disabled && styles.disabled]}>
								{isShowDisplayName ? friend?.user?.username : friend?.user?.display_name || friend?.user?.username}
							</Text>
						</View>
						{isFriend && showAction && !selectMode ? (
							<View style={styles.friendAction}>
								<Pressable onPress={() => onPressAction(EFriendItemAction.Call)}>
									<CallIcon width={24} height={18} color={themeValue.text} />
								</Pressable>
								<Pressable onPress={() => onPressAction(EFriendItemAction.MessageDetail)}>
									<MessageIcon width={25} height={18} color={themeValue.text} />
								</Pressable>
							</View>
						) : null}

						{isPendingFriendRequest && showAction && !selectMode ? (
							<View style={styles.friendAction}>
								<Pressable onPress={() => onPressAction(EFriendItemAction.Delete)}>
									<CloseIcon width={18} height={18} color={Colors.textGray} />
								</Pressable>
								{!isSentRequestFriend ? (
									<Pressable onPress={() => onPressAction(EFriendItemAction.Approve)} style={styles.approveIcon}>
										<CheckIcon width={25} height={18} color={Colors.white} />
									</Pressable>
								) : null}
							</View>
						) : null}

						{selectMode ? (
							<View style={styles.checkboxWrapper}>
								<BouncyCheckbox
									size={20}
									disabled={disabled}
									isChecked={isChecked}
									onPress={(value) => onSelectChange(friend, value)}
									fillColor={Colors.bgButton}
									iconStyle={{ borderRadius: 5 }}
									innerIconStyle={{
										borderWidth: 1.5,
										borderColor: isChecked ? Colors.bgButton : Colors.white,
										borderRadius: 5,
										opacity: disabled ? 0.4 : 1
									}}
									textStyle={{ fontFamily: 'JosefinSans-Regular' }}
								/>
							</View>
						) : null}
					</View>
				</View>
			</TouchableOpacity>
		);
	}
);
