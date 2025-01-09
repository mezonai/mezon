import { IOption, ITypeOptionSearch, IUerMention } from '@mezon/mobile-components';
import { Block, size } from '@mezon/mobile-ui';
import { DirectEntity, selectCurrentChannel } from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import UseMentionList from '../../../../hooks/useUserMentionList';
import { EmptySearchPage } from '../../../EmptySearchPage';
import UserInfoSearch from './UserInfoSearch';

interface ISeachOptionPageProps {
	searchText: string;
	onSelect: (user: IUerMention) => void;
	currentChannel: IChannel | DirectEntity;
	optionFilter: IOption;
}

function SearchOptionPage({ searchText, onSelect, optionFilter }: ISeachOptionPageProps) {
	const currentChannel = useSelector(selectCurrentChannel);

	const userListData = UseMentionList({
		channelID: (currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? currentChannel?.parrent_id : currentChannel?.channel_id) || '',
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
		<Block paddingHorizontal={size.s_20} marginVertical={size.s_20} width={'100%'} height={'100%'}>
			{[ITypeOptionSearch.MENTIONS, ITypeOptionSearch.FROM].includes(optionFilter?.title as ITypeOptionSearch) && (
				<Block height={'100%'} width={'100%'} paddingBottom={size.s_100}>
					{searchUserListByMention?.length ? (
						<FlashList
							showsVerticalScrollIndicator={false}
							data={searchUserListByMention}
							renderItem={({ item }) => <UserInfoSearch userData={item} onSelectUserInfo={onSelect} />}
							estimatedItemSize={100}
							removeClippedSubviews={true}
						/>
					) : (
						<EmptySearchPage emptyDescription="Unfortunately, we could not find any suggestions" />
					)}
				</Block>
			)}
		</Block>
	);
}

export default React.memo(SearchOptionPage);
