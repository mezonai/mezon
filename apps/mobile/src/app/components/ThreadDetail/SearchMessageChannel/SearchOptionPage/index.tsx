import type { IOption, IUerMention } from '@mezon/mobile-components';
import { ITypeOptionSearch } from '@mezon/mobile-components';
import type { DirectEntity } from '@mezon/store-mobile';
import { selectCurrentChannel } from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import UseMentionList from '../../../../hooks/useUserMentionList';
import { EmptySearchPage } from '../../../EmptySearchPage';
import { style } from './SearchOptionPage.styles';
import UserInfoSearch from './UserInfoSearch';

interface ISeachOptionPageProps {
	searchText: string;
	onSelect: (user: IUerMention) => void;
	currentChannel: IChannel | DirectEntity;
	optionFilter: IOption;
}

function SearchOptionPage({ searchText, onSelect, optionFilter }: ISeachOptionPageProps) {
	const currentChannel = useSelector(selectCurrentChannel);
	const styles = style();

	const userListData = UseMentionList({
		channelDetail: currentChannel,
		channelID: (currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? currentChannel?.parent_id : currentChannel?.channel_id) || '',
		channelMode: currentChannel?.type
	});
	const userListDataSearchByMention = useMemo(
		() =>
			userListData?.map((user) => {
				return {
					id: user?.id ?? '',
					display: user?.username ?? '',
					avatarUrl: user?.avatarUrl ?? '',
					subDisplay: user?.display
				};
			}),
		[userListData]
	);

	const searchUserListByMention = useMemo(() => {
		if (!searchText) return userListDataSearchByMention;

		const searchTextUserMention = searchText;
		if (searchTextUserMention) {
			return userListDataSearchByMention?.filter((user) =>
				user?.display?.toLowerCase()?.trim().includes(searchTextUserMention?.toLowerCase()?.trim())
			);
		}
		return userListDataSearchByMention;
	}, [searchText, userListDataSearchByMention]);
	return (
		<View style={styles.container}>
			{[ITypeOptionSearch.MENTIONS, ITypeOptionSearch.FROM].includes(optionFilter?.title as ITypeOptionSearch) && (
				<View style={styles.listContainer}>
					{searchUserListByMention?.length ? (
						<FlashList
							showsVerticalScrollIndicator={false}
							data={searchUserListByMention}
							renderItem={({ item }) => <UserInfoSearch userData={item} onSelectUserInfo={onSelect} />}
							estimatedItemSize={100}
							removeClippedSubviews={true}
							keyboardShouldPersistTaps="handled"
						/>
					) : (
						<EmptySearchPage emptyDescription="Unfortunately, we could not find any suggestions" />
					)}
				</View>
			)}
		</View>
	);
}

export default React.memo(SearchOptionPage);
