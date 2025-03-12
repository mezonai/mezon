import { useMyRole } from '@mezon/core';
import { Icons, isEqual } from '@mezon/mobile-components';
import { Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import { permissionRoleChannelActions, selectAllPermissionRoleChannel, selectPermissionChannel, useAppDispatch } from '@mezon/store-mobile';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import { APP_SCREEN, MenuChannelScreenProps } from '../../../navigation/ScreenTypes';
import { PermissionItem } from '../components/PermissionItem';
import { EOverridePermissionType, EPermissionStatus, ERequestStatus } from '../types/channelPermission.enum';
import { IPermissionSetting } from '../types/channelPermission.type';

type AdvancedPermissionOverrides = typeof APP_SCREEN.MENU_CHANNEL.ADVANCED_PERMISSION_OVERRIDES;
export const AdvancedPermissionOverrides = ({ navigation, route }: MenuChannelScreenProps<AdvancedPermissionOverrides>) => {
	const { channelId, id, type } = route.params;
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const { t } = useTranslation(['channelSetting']);
	const channelPermissionList = useSelector(selectPermissionChannel);
	const changedChannelPermissionList = useSelector(selectAllPermissionRoleChannel);
	const [originChannelPermissionValues, setOriginChannelPermissionValues] = useState<IPermissionSetting>();
	const [currentChannelPermissionValues, setCurrentChannelPermissionValues] = useState<IPermissionSetting>();
	const [visibleConfirmModal, setVisibleConfirmModal] = useState(false);
	const { maxPermissionId } = useMyRole();

	const isSettingNotChange = useMemo(() => {
		return isEqual(originChannelPermissionValues, currentChannelPermissionValues);
	}, [originChannelPermissionValues, currentChannelPermissionValues]);

	//override Role permission in channel
	const isOverrideRole = useMemo(() => {
		return EOverridePermissionType.Role === type;
	}, [type]);

	const saveChannelPermission = async () => {
		const permissionValueList = channelPermissionList?.reduce((acc, permission) => {
			const { slug, id } = permission;
			const permissionValue = {
				permission_id: id,
				type: currentChannelPermissionValues[id],
				slug
			};
			return [...acc, permissionValue];
		}, []);

		const updatePermissionPayload = {
			channelId,
			maxPermissionId,
			permission: permissionValueList,
			roleId: isOverrideRole ? id : '',
			userId: isOverrideRole ? '' : id
		};
		const response = await dispatch(permissionRoleChannelActions.setPermissionRoleChannel(updatePermissionPayload));

		const isError = response?.meta?.requestStatus === ERequestStatus.Rejected;
		Toast.show({
			type: 'success',
			props: {
				text2: isError ? t('channelPermission.toast.failed') : t('channelPermission.toast.success'),
				leadingIcon: isError ? <Icons.CloseIcon color={Colors.red} /> : <Icons.CheckmarkLargeIcon color={Colors.green} />
			}
		});
		if (visibleConfirmModal) {
			navigation.goBack();
		}
	};

	const handleBack = useCallback(() => {
		if (isSettingNotChange) {
			navigation.goBack();
			return;
		}
		setVisibleConfirmModal(true);
	}, [navigation, isSettingNotChange]);

	navigation.setOptions({
		headerTitle: () => (
			<View>
				<Text bold h3 color={themeValue?.white}>
					{t('channelPermission.permissionOverrides')}
				</Text>
			</View>
		),
		headerRight: () => {
			if (isSettingNotChange) return null;
			return (
				<TouchableOpacity onPress={saveChannelPermission}>
					<View style={{ marginRight: size.s_20, paddingVertical: size.s_10 }}>
						<Text h4 color={Colors.textViolet}>
							{t('channelPermission.save')}
						</Text>
					</View>
				</TouchableOpacity>
			);
		},
		headerLeft: () => {
			return (
				<TouchableOpacity onPress={handleBack}>
					<View style={{ marginLeft: size.s_16 }}>
						<Icons.ArrowLargeLeftIcon color={themeValue.white} height={size.s_22} width={size.s_22} />
					</View>
				</TouchableOpacity>
			);
		}
	});

	const onPermissionStatusChange = useCallback(
		(permissionId: string, status: EPermissionStatus) => {
			if (currentChannelPermissionValues?.[permissionId] === status) return;
			const newChannelPermissionValues = { ...currentChannelPermissionValues, [permissionId]: status };
			setCurrentChannelPermissionValues(newChannelPermissionValues);
		},
		[currentChannelPermissionValues]
	);

	const setInitialPermissionValues = () => {
		const nonDefaultValues = changedChannelPermissionList.reduce((acc, permission) => {
			return { ...acc, [permission.permission_id]: permission?.active ? EPermissionStatus.Allow : EPermissionStatus.Deny };
		}, {});
		const initialPermissionValue = channelPermissionList?.reduce((acc, permission) => {
			if (nonDefaultValues[permission?.id]) {
				return { ...acc, [permission?.id]: nonDefaultValues[permission?.id] };
			}
			return { ...acc, [permission?.id]: EPermissionStatus.None };
		}, {});
		setOriginChannelPermissionValues(initialPermissionValue);
		setCurrentChannelPermissionValues(initialPermissionValue);
	};

	useEffect(() => {
		if (changedChannelPermissionList) {
			setInitialPermissionValues();
		}
	}, [changedChannelPermissionList]);

	useEffect(() => {
		if (channelId && id) {
			if (isOverrideRole) {
				dispatch(
					permissionRoleChannelActions.fetchPermissionRoleChannel({
						channelId: channelId,
						roleId: id,
						userId: ''
					})
				);
			} else {
				dispatch(
					permissionRoleChannelActions.fetchPermissionRoleChannel({
						channelId: channelId,
						roleId: '',
						userId: id
					})
				);
			}
		}
	}, [channelId, dispatch, id, type, isOverrideRole]);

	return (
		<View style={{ flex: 1, backgroundColor: themeValue.secondary, paddingHorizontal: size.s_18, gap: size.s_18 }}>
			<Text color={themeValue.textDisabled}>{t('channelPermission.generalChannelPermission')}</Text>

			<ScrollView>
				<View style={{ gap: size.s_28 }}>
					{channelPermissionList?.map((permission) => {
						return (
							<PermissionItem
								key={permission?.id}
								permission={permission}
								status={currentChannelPermissionValues?.[permission?.id]}
								onPermissionStatusChange={onPermissionStatusChange}
							/>
						);
					})}
				</View>
			</ScrollView>

			<MezonConfirm
				visible={visibleConfirmModal}
				onVisibleChange={setVisibleConfirmModal}
				onConfirm={saveChannelPermission}
				onCancel={() => navigation?.goBack()}
				title={t('channelPermission.warningChangeSettingModal.title')}
				confirmText={t('channelPermission.warningChangeSettingModal.confirm')}
				content={t('channelPermission.warningChangeSettingModal.content')}
				hasBackdrop={true}
			/>
		</View>
	);
};
