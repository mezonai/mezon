import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { usePermissionChecker, useRoles } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllRolesClan, selectAllUserClans } from '@mezon/store-mobile';
import type { UsersClanEntity } from '@mezon/utils';
import { EPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import { SeparatorWithLine } from '../../../components/Common';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../constants/icon_cdn';
import type { MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { normalizeString } from '../../../utils/helpers';
import { AddMemberBS } from './components/AddMemberBs';
import { MemberItem } from './components/MemberItem';
import { style } from './styles';

type SetupMembersScreen = typeof APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS;
export const SetupMembers = ({ navigation, route }: MenuClanScreenProps<SetupMembersScreen>) => {
	const roleId = route.params?.roleId;
	const { t } = useTranslation('clanRoles');
	const rolesClan = useSelector(selectAllRolesClan);
	const usersClan = useSelector(selectAllUserClans);
	const [selectedMemberIdList, setSelectedMemberIdList] = useState<string[]>([]);
	const [searchMemberText, setSearchMemberText] = useState('');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { updateRole } = useRoles();
	const clanRole = useMemo(() => {
		return rolesClan?.find((r) => r?.id === roleId);
	}, [roleId, rolesClan]);
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

	const setInitialSelectedMember = useCallback(() => {
		const assignedMemberIds = clanRole?.role_user_list?.role_users?.map((user) => user?.id);
		const membersInRole = usersClan?.filter((user) => assignedMemberIds?.includes(user?.user?.id));
		const membersNotInRole = usersClan?.filter((user) => !assignedMemberIds?.includes(user?.user?.id));
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
		const response = await updateRole(newRole?.clan_id, newRole?.id, newRole?.title, newRole?.color || '', selectedMemberIdList, [], [], []);
		if (response) {
			navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
			Toast.show({
				type: 'success',
				props: {
					text2: t('setupMember.addedMember'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
				}
			});
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
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

	const handleClose = useCallback(() => {
		if (isEditRoleMode) {
			navigation.goBack();
		} else {
			navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
		}
	}, [isEditRoleMode, navigation]);

	return (
		<KeyboardAvoidingView
			behavior={'padding'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
			style={styles.flex}
		>
			<StatusBarHeight />
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={handleClose}>
					<MezonIconCDN
						icon={isEditRoleMode ? IconCDN.arrowLargeLeftIcon : IconCDN.closeSmallBold}
						height={size.s_20}
						width={size.s_20}
						color={themeValue.textStrong}
					/>
				</Pressable>
				{!isEditRoleMode ? (
					<Text style={styles.title}>{t('setupMember.title')}</Text>
				) : (
					<View style={styles.roleName}>
						<Text style={styles.name} numberOfLines={1}>
							{clanRole?.title}
						</Text>
						<Text style={styles.emptyText}>{t('roleDetail.role')}</Text>
					</View>
				)}
			</View>
			<View style={styles.container}>
				<View style={styles.addMember}>
					{!isEditRoleMode && (
						<View style={styles.addMemberTitle}>
							<Text style={styles.addMemberText}>{t('setupMember.addMember')}</Text>
							<Text style={styles.addMemberDescription}>{t('setupMember.description')}</Text>
						</View>
					)}

					<MezonInput value={searchMemberText} onTextChange={setSearchMemberText} placeHolder={t('setupMember.searchMembers')} />

					{isEditRoleMode && (
						<TouchableOpacity onPress={openAddMemberBottomSheet}>
							<View style={styles.addMemberButton}>
								<MezonIconCDN icon={IconCDN.circlePlusPrimaryIcon} />
								<View style={styles.flex}>
									<Text style={styles.text}>{t('setupMember.addMember')}</Text>
								</View>
								<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} />
							</View>
						</TouchableOpacity>
					)}
					<View style={styles.memberList}>
						{filteredMemberList.length ? (
							<View style={styles.listWrapper}>
								<FlatList
									data={filteredMemberList}
									keyExtractor={(item) => item?.id}
									ItemSeparatorComponent={SeparatorWithLine}
									initialNumToRender={1}
									maxToRenderPerBatch={1}
									windowSize={2}
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
							</View>
						) : (
							<View>
								<Text style={styles.emptyText}>{t('setupMember.noMembersFound')}</Text>
							</View>
						)}
					</View>
				</View>

				{!isEditRoleMode ? (
					<View style={styles.bottomButton}>
						<TouchableOpacity onPress={() => updateMemberToRole()}>
							<View style={styles.finishButton}>
								<Text style={styles.buttonText}>{t('setupMember.finish')}</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING)}>
							<View style={styles.cancelButton}>
								<Text style={styles.buttonText}>{t('skipStep')}</Text>
							</View>
						</TouchableOpacity>
					</View>
				) : (
					<AddMemberBS bottomSheetRef={bottomSheetRef} memberList={unAssignedMemberList} role={clanRole} onClose={onClose} />
				)}
			</View>
		</KeyboardAvoidingView>
	);
};
