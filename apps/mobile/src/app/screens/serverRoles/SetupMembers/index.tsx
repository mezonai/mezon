import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { usePermissionChecker, useRoles } from '@mezon/core';
import { CheckIcon, CloseIcon, Icons } from '@mezon/mobile-components';
import { Block, Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import { UsersClanEntity, selectAllRolesClan, selectAllUserClans, selectRoleByRoleId } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, Pressable, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MezonInput } from '../../../componentUI';
import { SeparatorWithLine } from '../../../components/Common';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { normalizeString } from '../../../utils/helpers';
import { AddMemberBS } from './components/AddMemberBs';
import { MemberItem } from './components/MemberItem';

type SetupMembersScreen = typeof APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS;
export const SetupMembers = ({ navigation, route }: MenuClanScreenProps<SetupMembersScreen>) => {
	const roleId = route.params?.roleId;
	const { t } = useTranslation('clanRoles');
	const rolesClan = useSelector(selectAllRolesClan);
	const usersClan = useSelector(selectAllUserClans);
	const [selectedMemberIdList, setSelectedMemberIdList] = useState<string[]>([]);
	const [searchMemberText, setSearchMemberText] = useState('');
	const { themeValue } = useTheme();
	const { updateRole } = useRoles();
	const clanRole = useSelector(selectRoleByRoleId(roleId)); //Note: edit role
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);

	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const [assignedMemberList, setAssignedMemberList] = useState<UsersClanEntity[]>([]);
	const [unAssignedMemberList, setUnAssignedMemberList] = useState<UsersClanEntity[]>([]);

	//Note: create new role
	const newRole = useMemo(() => {
		return rolesClan?.[rolesClan.length - 1];
	}, [rolesClan]);

	const isEditRoleMode = useMemo(() => {
		return Boolean(roleId);
	}, [roleId]);

	const isCanEditRole = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission;
	}, [hasAdminPermission, hasManageClanPermission, isClanOwner]);

	navigation.setOptions({
		headerTitle: !isEditRoleMode
			? t('setupMember.title')
			: () => {
					return (
						<Block>
							<Text center bold h3 color={themeValue?.white}>
								{clanRole?.title}
							</Text>
							<Text center color={themeValue?.text}>
								{t('roleDetail.role')}
							</Text>
						</Block>
					);
				},
		headerLeft: () => {
			if (isEditRoleMode) {
				return (
					<Pressable style={{ padding: 20 }} onPress={() => navigation.goBack()}>
						<Icons.ArrowLargeLeftIcon height={20} width={20} color={themeValue.textStrong} />
					</Pressable>
				);
			}
			return (
				<Pressable style={{ padding: 20 }} onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING)}>
					<Icons.CloseSmallBoldIcon height={20} width={20} color={themeValue.textStrong} />
				</Pressable>
			);
		}
	});

	const setInitialSelectedMember = useCallback(() => {
		const assignedMemberIds = clanRole?.role_user_list?.role_users?.map((user) => user?.id);
		const membersInRole = usersClan?.filter((user) => assignedMemberIds.includes(user?.user?.id));
		const membersNotInRole = usersClan?.filter((user) => !assignedMemberIds.includes(user?.user?.id));
		setAssignedMemberList(membersInRole);
		setUnAssignedMemberList(membersNotInRole);
	}, [clanRole?.role_user_list?.role_users, usersClan]);

	useEffect(() => {
		if (clanRole?.id) {
			setInitialSelectedMember();
		}
	}, [clanRole]);

	const onSelectMemberChange = (value: boolean, memberId: string) => {
		const uniqueSelectedMembers = new Set(selectedMemberIdList);
		if (value) {
			uniqueSelectedMembers.add(memberId);
			setSelectedMemberIdList([...uniqueSelectedMembers]);
			return;
		}
		uniqueSelectedMembers.delete(memberId);
		setSelectedMemberIdList([...uniqueSelectedMembers]);
	};

	const updateMemberToRole = async () => {
		const selectedPermissions = newRole?.permission_list?.permissions.filter((it) => it?.active).map((it) => it?.id);
		const response = await updateRole(
			newRole?.clan_id,
			newRole?.id,
			newRole?.title,
			newRole?.color || '',
			selectedMemberIdList,
			selectedPermissions,
			[],
			[]
		);
		if (response) {
			navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
			Toast.show({
				type: 'success',
				props: {
					text2: t('setupMember.addedMember'),
					leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
				}
			});
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
				}
			});
		}
	};

	const filteredMemberList = useMemo(() => {
		const memberList = isEditRoleMode ? assignedMemberList : usersClan;
		return memberList?.filter(
			(it) =>
				normalizeString(it?.user?.display_name).includes(normalizeString(searchMemberText)) ||
				normalizeString(it?.user?.username).includes(normalizeString(searchMemberText)) ||
				normalizeString(it?.clan_nick).includes(normalizeString(searchMemberText))
		);
	}, [searchMemberText, assignedMemberList, isEditRoleMode, usersClan]);

	const openAddMemberBottomSheet = () => {
		bottomSheetRef.current?.present();
	};

	const onClose = useCallback(() => {
		bottomSheetRef.current?.dismiss();
	}, []);

	return (
		<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
			<Block backgroundColor={themeValue.primary} flex={1} paddingHorizontal={size.s_14}>
				<Block flex={1} paddingTop={size.s_10}>
					{!isEditRoleMode && (
						<Block paddingVertical={size.s_10} borderBottomWidth={1} borderBottomColor={themeValue.borderDim} marginBottom={size.s_20}>
							<Text color={themeValue.white} h2 center bold>
								{t('setupMember.addMember')}
							</Text>
							<Text center color={themeValue.text}>
								{t('setupMember.description')}
							</Text>
						</Block>
					)}

					<MezonInput value={searchMemberText} onTextChange={setSearchMemberText} placeHolder={t('setupMember.searchMembers')} />

					{isEditRoleMode && (
						<TouchableOpacity onPress={openAddMemberBottomSheet}>
							<Block
								flexDirection="row"
								backgroundColor={themeValue.secondary}
								padding={size.s_10}
								borderRadius={size.s_6}
								gap={size.s_10}
								justifyContent="center"
							>
								<Icons.CirclePlusPrimaryIcon />
								<Block flex={1}>
									<Text color={themeValue.text}>{t('setupMember.addMember')}</Text>
								</Block>
								<Icons.ChevronSmallRightIcon />
							</Block>
						</TouchableOpacity>
					)}
					<Block marginVertical={size.s_10} flex={1}>
						{filteredMemberList.length ? (
							<Block borderRadius={size.s_10} overflow="hidden">
								<FlatList
									data={filteredMemberList}
									keyExtractor={(item) => item?.id}
									ItemSeparatorComponent={SeparatorWithLine}
									renderItem={({ item }) => {
										return (
											<MemberItem
												member={item}
												role={isEditRoleMode ? clanRole : newRole}
												isSelectMode={!isEditRoleMode}
												isSelected={selectedMemberIdList?.includes(item?.id)}
												onSelectChange={onSelectMemberChange}
												disabled={isEditRoleMode ? !isCanEditRole : false}
											/>
										);
									}}
								/>
							</Block>
						) : (
							<Block>
								<Text center color={themeValue.text}>
									{t('setupMember.noMembersFound')}
								</Text>
							</Block>
						)}
					</Block>
				</Block>

				{!isEditRoleMode ? (
					<Block marginBottom={size.s_16} gap={size.s_10}>
						<TouchableOpacity onPress={() => updateMemberToRole()}>
							<Block backgroundColor={Colors.bgViolet} paddingVertical={size.s_14} borderRadius={size.s_8}>
								<Text center color={Colors.white}>
									{t('setupMember.finish')}
								</Text>
							</Block>
						</TouchableOpacity>

						<TouchableOpacity onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING)}>
							<Block paddingVertical={size.s_14} borderRadius={size.s_8}>
								<Text center color={themeValue.text}>
									{t('skipStep')}
								</Text>
							</Block>
						</TouchableOpacity>
					</Block>
				) : (
					<AddMemberBS bottomSheetRef={bottomSheetRef} memberList={unAssignedMemberList} role={clanRole} onClose={onClose} />
				)}
			</Block>
		</TouchableWithoutFeedback>
	);
};
