import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { debounce } from '@mezon/mobile-components';
import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import {
	channelUsersActions,
	selectAllChannelMembers,
	selectAllRolesClan,
	selectAllUserClans,
	selectCurrentClanId,
	selectRolesByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../constants/icon_cdn';
import { normalizeString } from '../../../../utils/helpers';
import { EOverridePermissionType, ERequestStatus } from '../../types/channelPermission.enum';
import { IAddMemberOrRoleContentProps } from '../../types/channelPermission.type';
import { MemberItem } from '../MemberItem';
import { RoleItem } from '../RoleItem';
import { styles as stylesFn } from './AddMemberOrRoleContent.styles';

export const AddMemberOrRoleContent = memo(({ channel, onDismiss }: IAddMemberOrRoleContentProps) => {
	const { themeValue } = useTheme();
	const styles = stylesFn(themeValue);
	const [searchText, setSearchText] = useState('');
	const debouncedSetSearchText = debounce((text) => setSearchText(text), 300);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const { t } = useTranslation('channelSetting');
	const [selectedMemberIdList, setSelectedMemberIdList] = useState<string[]>([]);
	const [selectedRoleIdList, setSelectedRoleIdList] = useState<string[]>([]);

	const allClanMembers = useSelector(selectAllUserClans);
	const allClanRoles = useSelector(selectAllRolesClan);

	const listOfChannelMember = useAppSelector((state) => selectAllChannelMembers(state, channel?.channel_id as string));
	const listOfChannelRole = useSelector(selectRolesByChannelId(channel?.channel_id));

	const listOfMemberCanAdd = useMemo(() => {
		const addedMemberIdList = listOfChannelMember?.filter((member) => member?.userChannelId !== '0')?.map((member) => member?.user?.id) || [];
		return allClanMembers
			?.filter((member) => !addedMemberIdList.includes(member?.user?.id))
			?.map((member) => ({ ...member, type: EOverridePermissionType.Member }));
	}, [listOfChannelMember, allClanMembers]);

	const listOfRoleCanAdd = useMemo(() => {
		const addedRoleIdList = listOfChannelRole?.map((role) => role?.id) || [];
		return allClanRoles
			?.filter((role) => !addedRoleIdList.includes(role?.id) && role?.slug !== `everyone-${role?.clan_id}`)
			?.map((role) => ({ ...role, type: EOverridePermissionType.Role }));
	}, [listOfChannelRole, allClanRoles]);

	const disableAddButton = useMemo(() => {
		return !(selectedMemberIdList.length || selectedRoleIdList.length);
	}, [selectedMemberIdList, selectedRoleIdList]);

	const filteredSearch = useMemo(() => {
		if (!listOfRoleCanAdd) return [];
		const roleList = listOfRoleCanAdd?.filter((role) => normalizeString(role?.title)?.includes(normalizeString(searchText)));
		const memberList = listOfMemberCanAdd?.filter(
			(member) =>
				normalizeString(member?.user?.display_name)?.includes(normalizeString(searchText)) ||
				normalizeString(member?.user?.username).includes(normalizeString(searchText))
		);
		return [
			{ headerTitle: t('channelPermission.bottomSheet.roles'), isShowHeaderTitle: roleList?.length },
			...roleList,
			{ headerTitle: t('channelPermission.bottomSheet.members'), isShowHeaderTitle: memberList?.length },
			...memberList
		];
	}, [listOfRoleCanAdd, listOfMemberCanAdd, searchText, t]);

	const onSelectMemberChange = useCallback(
		(value: boolean, memberId: string) => {
			const newMemberIdList = new Set(selectedMemberIdList);
			if (value) {
				newMemberIdList.add(memberId);
				setSelectedMemberIdList([...newMemberIdList]);
				return;
			}
			newMemberIdList.delete(memberId);
			setSelectedMemberIdList([...newMemberIdList]);
		},
		[selectedMemberIdList]
	);

	const onSelectRoleChange = useCallback(
		(value: boolean, roleId: string) => {
			const newRoleIdList = new Set(selectedRoleIdList);
			if (value) {
				newRoleIdList.add(roleId);
				setSelectedRoleIdList([...newRoleIdList]);
				return;
			}
			newRoleIdList.delete(roleId);
			setSelectedRoleIdList([...newRoleIdList]);
		},
		[selectedRoleIdList]
	);

	const addMemberOrRole = async () => {
		if (disableAddButton) return;
		const promise = [];
		if (selectedMemberIdList?.length > 0) {
			const body = {
				channelId: channel.id,
				channelType: channel.type,
				userIds: selectedMemberIdList,
				clanId: currentClanId || ''
			};
			promise.push(dispatch(channelUsersActions.addChannelUsers(body)));
		}
		if (selectedRoleIdList?.length > 0) {
			const body = {
				clanId: currentClanId || '',
				channelId: channel.id,
				roleIds: selectedRoleIdList,
				channelType: channel.type
			};
			promise.push(dispatch(channelUsersActions.addChannelRoles(body)));
		}
		const response = await Promise.all(promise);
		const isError = response?.some((data) => data?.meta?.requestStatus === ERequestStatus.Rejected);
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
		onDismiss && onDismiss();
	};

	const renderItem = useCallback(
		({ item }) => {
			const { type, headerTitle, isShowHeaderTitle } = item;
			if (!type && headerTitle && isShowHeaderTitle) {
				return (
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionHeaderText}>
							{headerTitle}:
						</Text>
					</View>
				);
			}
			switch (type) {
				case EOverridePermissionType.Member:
					return (
						<MemberItem
							key={item?.id}
							member={item}
							isCheckbox={true}
							isChecked={selectedMemberIdList?.includes(item?.user?.id)}
							onSelectMemberChange={onSelectMemberChange}
						/>
					);
				case EOverridePermissionType.Role:
					return (
						<RoleItem
							key={item?.id}
							role={item}
							channel={channel}
							isCheckbox={true}
							isChecked={selectedRoleIdList?.includes(item?.id)}
							onSelectRoleChange={onSelectRoleChange}
						/>
					);
				default:
					return <View />;
			}
		},
		[onSelectMemberChange, channel, onSelectRoleChange, selectedMemberIdList, selectedRoleIdList, themeValue]
	);

	return (
		<View style={styles.container}>
			<View style={styles.headerContainer}>
				<View style={styles.headerCenter}>
					<Text style={styles.headerTitle}>
						{t('channelPermission.bottomSheet.addMembersOrRoles')}
					</Text>
					<Text style={styles.headerSubtitle}>
						#{channel?.channel_label}
					</Text>
				</View>
				<TouchableOpacity
					onPress={addMemberOrRole}
					style={styles.addButton}
					disabled={disableAddButton}
				>
					<View style={styles.addButtonInner}>
						<Text
							style={[
								styles.addButtonText,
								{ color: disableAddButton ? '#676b73' : baseColor.blurple }
							]}
						>
							{t('channelPermission.bottomSheet.add')}
						</Text>
					</View>
				</TouchableOpacity>
			</View>

			<View style={styles.searchWrapper}>
				<MezonInput onTextChange={debouncedSetSearchText} placeHolder={'Search Roles & Members'} />
			</View>
			<View style={styles.listWrapper}>
				<BottomSheetFlatList
					data={filteredSearch}
					keyboardShouldPersistTaps={'handled'}
					renderItem={renderItem}
					keyExtractor={(item) => `${item?.id}_${item?.headerTitle}`}
					removeClippedSubviews={true}
				/>
			</View>
		</View>
	);
});
