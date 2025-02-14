import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAuth, useCheckOwnerForUser } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { Block, Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	selectAllUserChannel,
	selectAllUserClans,
	selectEveryoneRole,
	selectRolesByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MezonConfirm, MezonSwitch } from '../../../componentUI';
import { AddMemberOrRoleBS } from '../components/AddMemberOrRoleBS';
import { MemberItem } from '../components/MemberItem';
import { RoleItem } from '../components/RoleItem';
import { EOverridePermissionType, ERequestStatus } from '../types/channelPermission.enum';
import { IBasicViewProps } from '../types/channelPermission.type';

export const BasicView = memo(({ channel }: IBasicViewProps) => {
	const { themeValue } = useTheme();
	const { userId } = useAuth();
	const navigation = useNavigation<any>();
	const [checkClanOwner] = useCheckOwnerForUser();
	const dispatch = useAppDispatch();
	const { t } = useTranslation('channelSetting');
	const [visibleModalConfirm, setVisibleModalConfirm] = useState(false);
	const [isPrivateChannel, setIsPrivateChannel] = useState(false);
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const everyoneRole = useSelector(selectEveryoneRole);
	const allClanMembers = useSelector(selectAllUserClans);

	const listOfChannelRole = useSelector(selectRolesByChannelId(channel?.channel_id));
	const listOfChannelMember = useAppSelector(selectAllUserChannel(channel.channel_id));

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
			return listOfChannelRole?.filter((role) => typeof role?.role_channel_active === 'number' && role?.role_channel_active === 1);
		}
		return [everyoneRole];
	}, [listOfChannelRole, channel?.channel_private, everyoneRole]);

	const combineWhoCanAccessList = useMemo(() => {
		return [
			{ headerTitle: t('channelPermission.roles'), isShowHeader: availableRoleList?.length },
			...availableRoleList.map((role) => ({ ...role, type: EOverridePermissionType.Role })),
			{ headerTitle: t('channelPermission.members'), isShowHeader: availableMemberList?.length },
			...availableMemberList.map((member) => ({ ...member, type: EOverridePermissionType.Member }))
		];
	}, [availableMemberList, availableRoleList, t]);

	const onPrivateChannelChange = useCallback((value: boolean) => {
		setIsPrivateChannel(value);
		setVisibleModalConfirm(true);
	}, []);

	const openBottomSheet = () => {
		bottomSheetRef.current?.present();
	};

	const updateChannel = async () => {
		await setVisibleModalConfirm(false);

		const response = await dispatch(
			channelsActions.updateChannelPrivate({
				channel_id: channel.id,
				channel_private: isPrivateChannel ? 0 : 1,
				user_ids: [userId],
				role_ids: []
			})
		);
		const isError = ERequestStatus.Rejected === response?.meta?.requestStatus;
		Toast.show({
			type: 'success',
			props: {
				text2: isError ? t('channelPermission.toast.failed') : t('channelPermission.toast.success'),
				leadingIcon: isError ? <Icons.CloseIcon color={Colors.red} /> : <Icons.CheckmarkLargeIcon color={Colors.green} />
			}
		});
	};

	const closeModalConfirm = () => {
		setIsPrivateChannel(!isPrivateChannel);
	};

	const renderWhoCanAccessItem = useCallback(
		({ item }) => {
			const { type, headerTitle, isShowHeader } = item;
			if (!type && headerTitle && isShowHeader) {
				return (
					<View style={{ paddingTop: size.s_12, paddingLeft: size.s_12 }}>
						<Text color={themeValue.white} h4>
							{headerTitle}:
						</Text>
					</View>
				);
			}
			switch (type) {
				case EOverridePermissionType.Member:
					return <MemberItem member={item} channel={channel} />;
				case EOverridePermissionType.Role:
					return <RoleItem role={item} channel={channel} />;
				default:
					return <View />;
			}
		},
		[channel, themeValue]
	);

	useEffect(() => {
		if (channel?.channel_private !== undefined) {
			setIsPrivateChannel(Boolean(channel?.channel_private));
		}
	}, [channel?.channel_private]);
	return (
		<View style={{ flex: 1 }}>
			<TouchableOpacity onPress={() => onPrivateChannelChange(!isPrivateChannel)}>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						padding: size.s_14,
						alignItems: 'center',
						borderRadius: size.s_14,
						backgroundColor: themeValue.primary,
						marginBottom: size.s_16
					}}
				>
					<View style={{ alignItems: 'center' }}>
						<Text color={themeValue.text}>{t('channelPermission.privateChannel')}</Text>
					</View>
					<MezonSwitch value={isPrivateChannel} onValueChange={onPrivateChannelChange} />
				</View>
			</TouchableOpacity>

			{Boolean(channel?.channel_private) && (
				<View>
					<Text color={themeValue.textDisabled}>{t('channelPermission.basicViewDescription')}</Text>

					<TouchableOpacity onPress={() => openBottomSheet()}>
						<View
							style={{
								flexDirection: 'row',
								justifyContent: 'space-between',
								padding: size.s_14,
								alignItems: 'center',
								borderRadius: size.s_14,
								backgroundColor: themeValue.primary,
								marginVertical: size.s_16
							}}
						>
							<View style={{ flexDirection: 'row', gap: size.s_14, alignItems: 'center' }}>
								<Icons.CirclePlusPrimaryIcon color={themeValue.text} />
								<Text color={themeValue.text}>{t('channelPermission.addMemberAndRoles')}</Text>
							</View>
							<Icons.ChevronSmallRightIcon color={themeValue.text} />
						</View>
					</TouchableOpacity>
				</View>
			)}

			<View style={{ gap: size.s_10, marginBottom: size.s_10, flex: 1 }}>
				<Text color={themeValue.textDisabled}>{t('channelPermission.whoCanAccess')}</Text>
				<View style={{ backgroundColor: themeValue.primary, borderRadius: size.s_14, flex: 1 }}>
					<FlashList
						data={combineWhoCanAccessList}
						keyboardShouldPersistTaps={'handled'}
						renderItem={renderWhoCanAccessItem}
						keyExtractor={(item) => `${item?.id}_${item?.headerTitle}`}
						removeClippedSubviews={true}
					/>
				</View>
			</View>

			<MezonConfirm
				visible={visibleModalConfirm}
				onVisibleChange={setVisibleModalConfirm}
				onConfirm={updateChannel}
				onCancel={closeModalConfirm}
				title={
					isPrivateChannel
						? t('channelPermission.warningModal.privateChannelTitle')
						: t('channelPermission.warningModal.publicChannelTitle')
				}
				confirmText={t('channelPermission.warningModal.confirm')}
				content={
					isPrivateChannel
						? t('channelPermission.warningModal.privateChannelContent', { channelLabel: channel?.channel_label })
						: t('channelPermission.warningModal.publicChannelContent', { channelLabel: channel?.channel_label })
				}
				hasBackdrop={true}
			/>
			<AddMemberOrRoleBS bottomSheetRef={bottomSheetRef} channel={channel} />
		</View>
	);
});
