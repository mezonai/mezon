import { debounce } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllUserClans, useAppSelector } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { MezonInput } from '../../../../componentUI';
import { normalizeString } from '../../../../utils/helpers';
import { SeparatorWithLine } from '../../../Common';
import { UserItem } from '../UserItem';

interface IMemberListProps {
	onMemberSelect: (memberId: UsersClanEntity) => void;
}

export const MemberList = memo((props: IMemberListProps) => {
	const { onMemberSelect } = props;
	const { themeValue } = useTheme();
	const [searchMemberText, setSearchMemberText] = useState('');
	const debouncedSetSearchText = debounce((text) => setSearchMemberText(text), 300);
	const clanUserList = useAppSelector(selectAllUserClans);

	const filteredMemberList = useMemo(() => {
		if (!clanUserList || clanUserList?.length === 0) {
			return [];
		}
		return clanUserList?.filter((member) => {
			return (
				normalizeString(member.user.display_name).includes(normalizeString(searchMemberText)) ||
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
		<View style={{ backgroundColor: themeValue.secondary, flex: 1 }}>
			<View style={{ paddingHorizontal: size.s_12 }}>
				<MezonInput onTextChange={debouncedSetSearchText} placeHolder={'Search Member'} />
			</View>
			<FlashList
				data={filteredMemberList}
				keyExtractor={(item) => item.id}
				ItemSeparatorComponent={SeparatorWithLine}
				renderItem={renderMemberItem}
				estimatedItemSize={180}
				removeClippedSubviews={true}
				keyboardShouldPersistTaps={'handled'}
			/>
		</View>
	);
});
