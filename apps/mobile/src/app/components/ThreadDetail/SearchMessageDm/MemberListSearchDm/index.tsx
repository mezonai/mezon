import { IOption, ITypeOptionSearch, IUerMention } from '@mezon/mobile-components';
import { DirectEntity } from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import UseMentionList from '../../../../hooks/useUserMentionList';
import { EmptySearchPage } from '../../../EmptySearchPage';
import UserInfoSearch from '../../SearchMessageChannel/SearchOptionPage/UserInfoSearch';
import { style } from './styles';

interface ISeachOptionPageProps {
	searchText: string;
	onSelect: (user: IUerMention) => void;
	currentChannel: IChannel | DirectEntity;
	optionFilter: IOption;
}

function MemberListSearchDm({ searchText, onSelect, optionFilter, currentChannel }: ISeachOptionPageProps) {
	const styles = style();

	const userListData = UseMentionList({
		channelDetail: currentChannel,
		channelID: currentChannel?.channelId,
		channelMode: currentChannel?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP
	});

	const userListDataSearchByMention = useMemo(
		() =>
			userListData?.map((user) => {
				return {
					id: user?.id ?? '',
					display: user?.display ?? user?.username ?? '',
					avatarUrl: user?.avatarUrl ?? '',
					subDisplay: user?.username
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

	const handleSelectUserInfo = (user: IUerMention) => {
		onSelect(user);
	};

	return (
		<View style={styles.container}>
			{[ITypeOptionSearch.MENTIONS, ITypeOptionSearch.FROM].includes(optionFilter?.title as ITypeOptionSearch) && (
				<View style={styles.listContainer}>
					{searchUserListByMention?.length ? (
						<FlashList
							showsVerticalScrollIndicator={false}
							data={searchUserListByMention}
							renderItem={({ item }) => <UserInfoSearch userData={item} onSelectUserInfo={handleSelectUserInfo} />}
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

export default React.memo(MemberListSearchDm);
