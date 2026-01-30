import { useTheme } from '@mezon/mobile-ui';
import { channelUsersActions, selectCurrentClanCreatorId, selectCurrentUserId, useAppDispatch } from '@mezon/store-mobile';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { EOverridePermissionType, ERequestStatus } from '../../types/channelPermission.enum';
import type { IMemberItemProps } from '../../types/channelPermission.type';
import { styles as stylesFn } from './MemberItem.styles';

export const MemberItem = memo(
	({ member, channel, isCheckbox = false, isChecked = false, onSelectMemberChange, isAdvancedSetting = false, onPress }: IMemberItemProps) => {
		const userId = useSelector(selectCurrentUserId);
		const currentClanCreatorId = useSelector(selectCurrentClanCreatorId);
		const isClanOwner = useMemo(() => {
			return currentClanCreatorId === member?.user?.id;
		}, [currentClanCreatorId, member?.user?.id]);
		const { themeValue } = useTheme();
		const styles = stylesFn(themeValue);
		const dispatch = useAppDispatch();
		const { t } = useTranslation('channelSetting');

		const priorityMemberAvatar = useMemo(() => {
			return member?.clan_avatar || member?.user?.avatar_url || '';
		}, [member?.clan_avatar, member?.user?.avatar_url]);

		const priorityMemberName = useMemo(() => {
			return member?.clan_nick || member?.user?.display_name || member?.user?.username || '';
		}, [member?.clan_nick, member?.user?.display_name, member?.user?.username]);

		const disabled = useMemo(() => {
			return !isCheckbox && !isAdvancedSetting;
		}, [isCheckbox, isAdvancedSetting]);

		const deleteMember = async () => {
			try {
				const response = await dispatch(
					channelUsersActions.removeChannelUsers({
						channelId: channel?.id,
						userId: member?.user?.id,
						channelType: channel?.type,
						clanId: channel?.clan_id
					})
				);
				if (response?.meta?.requestStatus === ERequestStatus.Rejected) {
					Toast.show({
						type: 'error',
						text1: t('channelPermission.toast.failed')
					});
				} else {
					Toast.show({
						type: 'success',
						text1: t('channelPermission.toast.success')
					});
				}
			} catch (error) {
				console.error('Error deleting member:', error);
			}
		};

		const disableDeleteButton = useMemo(() => {
			return isClanOwner || userId === member?.user?.id;
		}, [isClanOwner, member?.user?.id, userId]);

		const getSuffixIcon = () => {
			if (isCheckbox) {
				return (
					<View style={styles.checkboxContainer}>
						<BouncyCheckbox
							size={20}
							isChecked={isChecked}
							onPress={(value) => onSelectMemberChange(value, member?.user?.id)}
							fillColor={'#5865f2'}
							iconStyle={{ borderRadius: 5 }}
							innerIconStyle={{
								borderWidth: 1.5,
								borderColor: isChecked ? '#5865f2' : '#ccc',
								borderRadius: 5
							}}
						/>
					</View>
				);
			}
			if (isAdvancedSetting) {
				return <MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.white} />;
			}
			return (
				<TouchableOpacity onPress={deleteMember} disabled={disableDeleteButton}>
					<MezonIconCDN icon={IconCDN.circleXIcon} color={disableDeleteButton ? themeValue.textDisabled : themeValue.white} />
				</TouchableOpacity>
			);
		};

		const onPressMemberItem = useCallback(() => {
			if (isAdvancedSetting) {
				onPress && onPress(member?.user?.id, EOverridePermissionType.Member);
				return;
			}
			onSelectMemberChange(!isChecked, member?.user?.id);
		}, [isChecked, member?.user?.id, onSelectMemberChange, isAdvancedSetting, onPress]);

		return (
			<TouchableOpacity onPress={onPressMemberItem} disabled={disabled}>
				<View style={styles.container}>
					<View style={styles.avatarWrapper}>
						<MezonClanAvatar alt={member?.user?.username || ''} image={priorityMemberAvatar} />
					</View>
					<View style={styles.userInfoContainer}>
						<View style={styles.nameRow}>
							<Text numberOfLines={1} style={styles.nameText}>
								{priorityMemberName}
							</Text>
							{isClanOwner && <MezonIconCDN icon={IconCDN.ownerIcon} color={themeValue.borderWarning} width={16} height={16} />}
						</View>
						{!isAdvancedSetting && (
							<Text numberOfLines={1} style={styles.usernameText}>
								{member?.user?.username || ''}
							</Text>
						)}
					</View>
					{getSuffixIcon()}
				</View>
			</TouchableOpacity>
		);
	}
);
