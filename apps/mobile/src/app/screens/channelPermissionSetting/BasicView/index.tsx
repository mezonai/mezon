import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAuth, useCheckOwnerForUser } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import type { IUpdateChannelRequest } from '@mezon/store-mobile';
import {
	appActions,
	channelsActions,
	fetchUserChannels,
	listChannelRenderAction,
	rolesClanActions,
	selectAllUserClans,
	selectRolesByChannelId,
	selectUserChannelIds,
	useAppDispatch
} from '@mezon/store-mobile';
import { isPublicChannel } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import type { ApiChangeChannelPrivateRequest } from 'mezon-js/api.gen';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonSwitch from '../../../componentUI/MezonSwitch';
import { IconCDN } from '../../../constants/icon_cdn';
import { AddMemberOrRoleBS } from '../components/AddMemberOrRoleBS';
import { MemberItem } from '../components/MemberItem';
import { RoleItem } from '../components/RoleItem';
import { EOverridePermissionType, ERequestStatus } from '../types/channelPermission.enum';
import type { IBasicViewProps } from '../types/channelPermission.type';
import { style } from './styles';

export const BasicView = memo(({ channel }: IBasicViewProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { userId } = useAuth();
	const [checkClanOwner] = useCheckOwnerForUser();
	const dispatch = useAppDispatch();
	const { t } = useTranslation('channelSetting');
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const allClanMembers = useSelector(selectAllUserClans);
	const [isChannelPublic, setIsChannelPublic] = useState<boolean>(isPublicChannel(channel));

	const listOfChannelRole = useSelector(selectRolesByChannelId(channel?.channel_id));
	const listChannelMemberIds = useSelector((state) => selectUserChannelIds(state, channel.channel_id));
	const listOfChannelMember = useMemo(() => {
		return allClanMembers?.filter((member) => listChannelMemberIds?.includes(member?.user?.id));
	}, [allClanMembers, listChannelMemberIds]);

	useEffect(() => {
		dispatch(rolesClanActions.fetchRolesClan({ clanId: channel?.clan_id }));
		dispatch(fetchUserChannels({ channelId: channel?.channel_id }));
	}, [channel?.channel_id, channel?.clan_id, dispatch]);

	const clanOwner = useMemo(() => {
		return allClanMembers?.find((member) => checkClanOwner(member?.user?.id));
	}, [allClanMembers, checkClanOwner]);

	const availableMemberList = useMemo(() => {
		if (channel?.channel_private) {
			return listOfChannelMember;
		}
		return [clanOwner];
	}, [channel?.channel_private, clanOwner, listOfChannelMember]);

	const availableRoleList = useMemo(() => {
		if (channel?.channel_private) {
			return listOfChannelRole?.filter(
				(role) =>
					typeof role?.role_channel_active === 'number' && role?.role_channel_active === 1 && role?.slug !== `everyone-${role?.clan_id}`
			);
		}
		return [];
	}, [listOfChannelRole, channel?.channel_private]);

	const combineWhoCanAccessList = useMemo(() => {
		return [
			{ headerTitle: t('channelPermission.roles'), isShowHeader: availableRoleList?.length },
			...availableRoleList.map((role) => ({ ...role, type: EOverridePermissionType.Role })),
			{ headerTitle: t('channelPermission.members'), isShowHeader: availableMemberList?.length },
			...availableMemberList.map((member) => ({ ...member, type: EOverridePermissionType.Member }))
		];
	}, [availableMemberList, availableRoleList, t]);

	const onPrivateChannelChange = useCallback((value: boolean) => {
		setIsChannelPublic(!value);
		updateChannel(!value);
	}, []);

	const openBottomSheet = () => {
		bottomSheetRef.current?.present();
	};

	const updateChannel = useCallback(
		async (isPublic: boolean) => {
			try {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
				dispatch(appActions.setLoadingMainMobile(true));

				const currentChannelPrivate = isPublic ? 1 : 0;
				const updateUpdateChannelRequest: ApiChangeChannelPrivateRequest = {
					clan_id: channel?.clan_id,
					channel_id: channel?.channel_id || '',
					channel_private: currentChannelPrivate,
					user_ids: [userId],
					role_ids: []
				};

				const response = await dispatch(channelsActions.updateChannelPrivate(updateUpdateChannelRequest));

				dispatch(
					channelsActions.updateChannelPrivateState({
						clanId: channel?.clan_id || '',
						channelId: channel?.channel_id || '',
						channelPrivate: Number(!isPublic)
					})
				);
				dispatch(
					listChannelRenderAction.updateChannelInListRender({
						channelId: channel?.channel_id || '',
						clanId: channel?.clan_id || '',
						dataUpdate: {
							...updateUpdateChannelRequest,
							channel_private: Number(!isPublic)
						} as IUpdateChannelRequest
					})
				);

				const isError = ERequestStatus.Rejected === response?.meta?.requestStatus;
				if (isError) {
					throw new Error();
				} else {
					Toast.show({
						type: 'success',
						props: {
							text2: t('channelPermission.toast.success'),
							leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkLargeIcon} color={baseColor.green} />
						}
					});
				}
			} catch (error) {
				setIsChannelPublic(isPublicChannel(channel));
				Toast.show({
					type: 'error',
					text1: t('channelPermission.toast.failed')
				});
			} finally {
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[channel, userId, t]
	);

	const renderWhoCanAccessItem = useCallback(
		({ item }) => {
			const { type, headerTitle, isShowHeader } = item;
			if (!type && headerTitle && isShowHeader) {
				return (
					<View style={styles.headerItemContainer}>
						<Text style={styles.headerItemText}>{headerTitle}:</Text>
					</View>
				);
			}
			switch (type) {
				case EOverridePermissionType.Member:
					if (!item?.user?.id || !item?.user?.username) return <View />;
					return <MemberItem member={item} channel={channel} />;
				case EOverridePermissionType.Role:
					return <RoleItem role={item} channel={channel} />;
				default:
					return <View />;
			}
		},
		[channel, styles]
	);

	const handlePressChangeChannelPrivate = useCallback(() => {
		onPrivateChannelChange(isChannelPublic);
	}, [isChannelPublic, onPrivateChannelChange]);

	return (
		<View style={styles.container}>
			<TouchableOpacity onPress={handlePressChangeChannelPrivate}>
				<View style={styles.privateChannelContainer}>
					<View style={styles.privateChannelTextContainer}>
						<Text style={styles.privateChannelText}>{t('channelPermission.privateChannel')}</Text>
					</View>
					<MezonSwitch value={!isChannelPublic} onValueChange={onPrivateChannelChange} />
				</View>
			</TouchableOpacity>

			{Boolean(channel?.channel_private) && (
				<View>
					<Text style={styles.descriptionText}>{t('channelPermission.basicViewDescription')}</Text>

					<TouchableOpacity onPress={() => openBottomSheet()}>
						<View style={styles.addMemberContainer}>
							<View style={styles.addMemberLeftContent}>
								<MezonIconCDN icon={IconCDN.circlePlusPrimaryIcon} color={themeValue.text} />
								<Text style={styles.addMemberText}>{t('channelPermission.addMemberAndRoles')}</Text>
							</View>
							<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} />
						</View>
					</TouchableOpacity>
				</View>
			)}

			<View style={styles.whoCanAccessContainer}>
				<Text style={styles.descriptionText}>{t('channelPermission.whoCanAccess')}</Text>
				<View style={styles.whoCanAccessListContainer}>
					<FlashList
						data={combineWhoCanAccessList}
						keyboardShouldPersistTaps={'handled'}
						renderItem={renderWhoCanAccessItem}
						keyExtractor={(item) => `${item?.id}_${item?.headerTitle}`}
						removeClippedSubviews={true}
					/>
				</View>
			</View>

			<AddMemberOrRoleBS bottomSheetRef={bottomSheetRef} channel={channel} />
		</View>
	);
});
