import { useAuth, useCheckOwnerForUser } from '@mezon/core';
import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { channelUsersActions, useAppDispatch } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import MezonAvatar from '../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { EOverridePermissionType, ERequestStatus } from '../../types/channelPermission.enum';
import { IMemberItemProps } from '../../types/channelPermission.type';

export const MemberItem = memo(
	({ member, channel, isCheckbox = false, isChecked = false, onSelectMemberChange, isAdvancedSetting = false, onPress }: IMemberItemProps) => {
		const { userId } = useAuth();
		const [checkClanOwner] = useCheckOwnerForUser();
		const isClanOwner = checkClanOwner(member?.user?.id);
		const { themeValue } = useTheme();
		const dispatch = useAppDispatch();
		const { t } = useTranslation('channelSetting');

		const disabled = useMemo(() => {
			return !isCheckbox && !isAdvancedSetting;
		}, [isCheckbox, isAdvancedSetting]);

		const deleteMember = async () => {
			const body = {
				channelId: channel.id,
				userId: member?.user?.id,
				channelType: channel.type,
				clanId: channel.clan_id
			};
			const response = await dispatch(channelUsersActions.removeChannelUsers(body));
			const isError = response?.meta?.requestStatus === ERequestStatus.Rejected;
			Toast.show({
				type: 'success',
				props: {
					text2: isError ? t('channelPermission.toast.failed') : t('channelPermission.toast.success'),
					leadingIcon: isError ? (
						<MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} />
					) : (
						<MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={baseColor.green} />
					)
				}
			});
		};

		const disableDeleteButton = useMemo(() => {
			return isClanOwner || userId === member?.user?.id;
		}, [isClanOwner, member?.user?.id, userId]);

		const getSuffixIcon = () => {
			if (isCheckbox) {
				return (
					<View style={{ height: size.s_20, width: size.s_20 }}>
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
				<View style={{ gap: size.s_10, flexDirection: 'row', padding: size.s_10, alignItems: 'center' }}>
					<MezonAvatar
						avatarUrl={createImgproxyUrl(member?.user?.avatar_url ?? '', { width: 100, height: 100, resizeType: 'fit' })}
						username={member.user.username}
						width={size.s_40}
						height={size.s_40}
						isBorderBoxImage
					/>
					<View style={{ flex: 1 }}>
						<View style={{ flexDirection: 'row', gap: size.s_4, alignItems: 'center' }}>
							<Text
								style={{
									fontSize: verticalScale(18),
									marginLeft: 0,
									marginRight: 0,
									color: themeValue.white
								}}
							>
								{member?.user?.display_name || member?.user?.username}
							</Text>
							{isClanOwner && <MezonIconCDN icon={IconCDN.ownerIcon} color={themeValue.borderWarning} width={16} height={16} />}
						</View>
						{!isAdvancedSetting && (
							<Text
								style={{
									marginLeft: 0,
									marginRight: 0,
									color: themeValue.textDisabled
								}}
							>
								{member?.user?.username}
							</Text>
						)}
					</View>
					{getSuffixIcon()}
				</View>
			</TouchableOpacity>
		);
	}
);
