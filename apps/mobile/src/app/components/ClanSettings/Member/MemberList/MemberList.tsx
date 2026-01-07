import { debounce } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllUserClans, useAppSelector } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import MezonInput from '../../../../componentUI/MezonInput';
import { normalizeString } from '../../../../utils/helpers';
import { SeparatorWithLine } from '../../../Common';
import { UserItem } from '../UserItem';

interface IMemberListProps {
	onMemberSelect: (memberId: UsersClanEntity) => void;
}

export const MemberList = memo((props: IMemberListProps) => {
	const { onMemberSelect } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation('clanMenu');
	const [searchMemberText, setSearchMemberText] = useState('');
	const debouncedSetSearchText = debounce((text) => setSearchMemberText(text), 300);
	const clanUserList = useAppSelector(selectAllUserClans);

	const filteredMemberList = useMemo(() => {
		if (!clanUserList || clanUserList?.length === 0) {
			return [];
		}
		return clanUserList?.filter((member) => {
			return (
				normalizeString(member.user.displayName).includes(normalizeString(searchMemberText)) ||
				normalizeString(member.user.username).includes(normalizeString(searchMemberText))
			);
		});
	}, [searchMemberText, clanUserList]);

	const renderMemberItem = useCallback(
		({ item }) => {
			return <UserItem userID={item.id} onMemberSelect={onMemberSelect} />;
		},
		[onMemberSelect]
	);

	return (
		<View style={{ backgroundColor: themeValue.primary, flex: 1 }}>
			<View style={{ paddingHorizontal: size.s_12, marginTop: size.s_10 }}>
				<MezonInput onTextChange={debouncedSetSearchText} placeHolder={t('common.searchMembers')} />
			</View>
			<FlatList
				data={filteredMemberList}
				keyExtractor={(item, index) => `${item?.id}_${index}_member`}
				ItemSeparatorComponent={SeparatorWithLine}
				renderItem={renderMemberItem}
				keyboardShouldPersistTaps={'handled'}
				onEndReachedThreshold={0.1}
				initialNumToRender={5}
				maxToRenderPerBatch={5}
				windowSize={5}
				updateCellsBatchingPeriod={10}
				decelerationRate={'fast'}
				disableVirtualization={true}
				removeClippedSubviews={true}
				getItemLayout={(_, index) => ({
					length: size.s_80,
					offset: size.s_80 * index,
					index
				})}
			/>
		</View>
	);
});
