import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useRoles } from '@mezon/core';
import { debounce } from '@mezon/mobile-components';
import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { RolesClanEntity } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { normalizeString } from '../../../../../utils/helpers';
import { MemberItem } from '../MemberItem';
import { styles as localStyles } from './AddMemberBsContent.styles';

interface IAddMemberBsContentProps {
	memberList?: UsersClanEntity[];
	role?: RolesClanEntity;
	onClose?: () => void;
}

export const AddMemberBsContent = memo((props: IAddMemberBsContentProps) => {
	const { memberList = [], role, onClose } = props;
	const { themeValue } = useTheme();
	const { updateRole } = useRoles();
	const { t } = useTranslation('clanRoles');
	const [searchMemberText, setSearchMemberText] = useState('');
	const debouncedSetSearchText = debounce((text) => setSearchMemberText(text), 300);
	const [selectedMemberIdList, setSelectedMemberIdList] = useState<string[]>([]);

	const filteredMemberList = useMemo(() => {
		return memberList?.filter(
			(it) =>
				normalizeString(it?.user?.displayName).includes(normalizeString(searchMemberText)) ||
				normalizeString(it?.user?.username).includes(normalizeString(searchMemberText)) ||
				normalizeString(it?.clanNick).includes(normalizeString(searchMemberText))
		);
	}, [searchMemberText, memberList]);

	const onSelectChange = useCallback(
		(value: boolean, memberId: string) => {
			const uniqueMemberIds = new Set(selectedMemberIdList);
			if (value) {
				uniqueMemberIds.add(memberId);
				setSelectedMemberIdList([...uniqueMemberIds]);
				return;
			}
			uniqueMemberIds.delete(memberId);
			setSelectedMemberIdList([...uniqueMemberIds]);
		},
		[selectedMemberIdList]
	);

	const handleAddMemberToRole = useCallback(async () => {
		const response = await updateRole(role?.clanId, role?.id, role?.title, role?.color || '', selectedMemberIdList, [], [], []);
		onClose && onClose();
		if (response) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('setupMember.addedMember'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
				}
			});
		} else {
			Toast.show({
				type: 'error',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		}
	}, [updateRole, role?.clanId, role?.id, role?.title, role?.color, selectedMemberIdList, onClose, t]);

	const componentStyles = localStyles(themeValue);

	return (
		<View style={componentStyles.container}>
			<View style={componentStyles.headerContainer}>
				<Text style={componentStyles.title}>{t('setupMember.addMember')}</Text>
				<Text style={componentStyles.roleTitle}>{role?.title}</Text>
				{selectedMemberIdList?.length ? (
					<View style={componentStyles.addButtonContainer}>
						<TouchableOpacity onPress={handleAddMemberToRole} style={componentStyles.addButton}>
							<Text style={componentStyles.addButtonText}>{t('setupMember.add')}</Text>
						</TouchableOpacity>
					</View>
				) : null}
			</View>
			<MezonInput onTextChange={debouncedSetSearchText} placeHolder={t('setupMember.searchMembers')} />
			{filteredMemberList?.length ? (
				<BottomSheetFlatList
					data={filteredMemberList}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => {
						return (
							<MemberItem
								member={item}
								isSelectMode={true}
								onSelectChange={onSelectChange}
								isSelected={selectedMemberIdList?.includes(item.id)}
								role={role}
							/>
						);
					}}
				/>
			) : (
				<View>
					<Text style={componentStyles.noMembersText}>{t('setupMember.noMembersFound')}</Text>
				</View>
			)}
		</View>
	);
});
