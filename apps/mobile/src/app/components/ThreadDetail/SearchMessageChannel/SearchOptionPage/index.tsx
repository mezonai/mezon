import type { IOption, IUerMention } from '@mezon/mobile-components';
import { ITypeOptionSearch } from '@mezon/mobile-components';
import type { ChannelUsersEntity, DirectEntity } from '@mezon/store-mobile';
import { selectAllChannels, selectCurrentChannel } from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import { FlashList } from '@shopify/flash-list';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import UseMentionList from '../../../../hooks/useUserMentionList';
import { ChannelItem } from '../../../ChannelItem';
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
	const styles = style();
	const { t } = useTranslation(['media']);

	const currentChannel = useSelector(selectCurrentChannel);
	const allChannels = useSelector(selectAllChannels);
	const filteredChannels = useMemo(() => allChannels?.filter((channel) => channel?.type !== ChannelType.CHANNEL_TYPE_APP) || [], [allChannels]);

	const userListData = UseMentionList({
		channelDetail: currentChannel,
		channelID: (currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? currentChannel?.parent_id : currentChannel?.channel_id) || '',
		channelMode: currentChannel?.type
	});

	const userListDataSearchByMention = useMemo(() => {
		if (!userListData?.length) return [];
		return userListData.map((user) => {
			return {
				id: user?.id ?? '',
				display: user?.username ?? '',
				avatarUrl: user?.avatarUrl ?? '',
				subDisplay: user?.display
			};
		});
	}, [userListData]);

	const searchUserListByMention = useMemo(() => {
		if (!searchText) return userListDataSearchByMention;

		return userListDataSearchByMention.filter((user) => (user?.display ?? '').toLowerCase().includes(searchText.toLowerCase().trim()));
	}, [searchText, userListDataSearchByMention]);

	const searchChannelList = useMemo(() => {
		if (!searchText) return filteredChannels;

		try {
			return filteredChannels.filter((channel) => (channel?.channel_label ?? '').toLowerCase().includes(searchText.toLowerCase().trim())) || [];
		} catch (error) {
			console.error('Filter search channel list error', error);
			return [];
		}
	}, [searchText, filteredChannels]);

	const handleSelectChannel = useCallback(
		(channel: ChannelUsersEntity) => {
			try {
				onSelect({
					id: (channel?.channel_id || channel?.id) ?? '',
					display: channel?.channel_label ?? '',
					avatarUrl: '',
					subDisplay: ''
				});
			} catch (error) {
				console.error('Handle select channel error', error);
			}
		},
		[onSelect]
	);

	return (
		<View style={styles.container}>
			{[ITypeOptionSearch.MENTIONS, ITypeOptionSearch.FROM].includes(optionFilter?.title as ITypeOptionSearch) && (
				<View style={styles.listContainer}>
					{searchUserListByMention.length ? (
						<FlashList
							showsVerticalScrollIndicator={false}
							data={searchUserListByMention}
							renderItem={({ item }) => <UserInfoSearch userData={item} onSelectUserInfo={onSelect} />}
							estimatedItemSize={100}
							removeClippedSubviews={true}
							keyboardShouldPersistTaps="handled"
						/>
					) : (
						<EmptySearchPage emptyDescription={t('emptyDescription')} />
					)}
				</View>
			)}

			{optionFilter?.title === ITypeOptionSearch.IN && (
				<View style={styles.listContainer}>
					{searchChannelList.length ? (
						<FlashList
							showsVerticalScrollIndicator={false}
							data={searchChannelList}
							renderItem={({ item }) => <ChannelItem channelData={item} onSelectChannel={handleSelectChannel} isHideClanName />}
							estimatedItemSize={100}
							removeClippedSubviews={true}
							keyboardShouldPersistTaps="handled"
						/>
					) : (
						<EmptySearchPage emptyDescription={t('emptyDescription')} />
					)}
				</View>
			)}
		</View>
	);
}

export default memo(SearchOptionPage);
