import { useTheme } from '@mezon/mobile-ui';
import type { FriendsEntity } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import React, { useMemo } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox/build/dist/BouncyCheckbox';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import ImageNative from '../ImageNative';
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
		const styles = style(themeValue, isChecked, disabled);
		const userStatus = { status: friend?.user?.online, isMobile: friend?.user?.is_mobile };

		const isFriend = friend.state === 0;
		const isSentRequestFriend = friend.state === 1;
		const isPendingFriendRequest = [1, 2].includes(friend.state);

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
						<View style={[styles.friendAvatar, disabled && styles.avatarDisabled]}>
							<ImageNative
								url={createImgproxyUrl(friend?.user?.avatar_url ?? '', { width: 100, height: 100, resizeType: 'fit' })}
								style={{ width: '100%', height: '100%' }}
								resizeMode={'cover'}
							/>
						</View>
					) : (
						<View style={styles.wrapperTextAvatar}>
							<Text style={[styles.textAvatar, disabled && styles.avatarDisabled]}>
								{friend?.user?.username?.charAt?.(0)?.toUpperCase()}
							</Text>
						</View>
					)}
					{!isPendingFriendRequest ? <UserStatus status={userStatus} customStatus={friend?.user?.status} /> : null}
				</View>
				<View style={styles.fill}>
					<View style={styles.friendItemContent}>
						<View style={styles.displayName}>
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
									<MezonIconCDN icon={IconCDN.phoneCallIcon} width={24} height={18} color={themeValue.text} />
								</Pressable>
								<Pressable onPress={() => onPressAction(EFriendItemAction.MessageDetail)}>
									<MezonIconCDN icon={IconCDN.chatIcon} width={25} height={18} color={themeValue.text} />
								</Pressable>
							</View>
						) : null}

						{isPendingFriendRequest && showAction && !selectMode ? (
							<View style={styles.friendAction}>
								<Pressable onPress={() => onPressAction(EFriendItemAction.Delete)}>
									<MezonIconCDN icon={IconCDN.closeIcon} width={18} height={18} color={'#c7c7c7'} />
								</Pressable>
								{!isSentRequestFriend ? (
									<Pressable onPress={() => onPressAction(EFriendItemAction.Approve)} style={styles.approveIcon}>
										<MezonIconCDN icon={IconCDN.checkmarkSmallIcon} width={25} height={18} color={'white'} />
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
									fillColor={'#5865f2'}
									iconStyle={{ borderRadius: 5 }}
									innerIconStyle={styles.innerIconStyle}
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
