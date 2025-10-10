import { useDMInvite } from '@mezon/core';
import type { DirectEntity, FriendsEntity } from '@mezon/store';
import { selectAllDirectMessages, selectAllFriends, selectAllMembersInClan, selectBlockedUsers, useAppSelector } from '@mezon/store';
import type { UsersClanEntity } from '@mezon/utils';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import ListMemberInviteItem from './ListMemberInviteItem';
import { processUserData } from './dataHelper';
export type ModalParam = {
	url: string;
	channelID?: string;
	isInviteExternalCalling?: boolean;
};
const ListMemberInvite = (props: ModalParam) => {
	const { t } = useTranslation('invitation');
	const { isInviteExternalCalling = false } = props;
	const { listDMInvite } = useDMInvite(props.channelID);
	const [searchTerm, setSearchTerm] = useState('');
	const [sendIds, setSendIds] = useState<Record<string, boolean>>({});
	const blockedUsers = useSelector(selectBlockedUsers);

	const [filteredListDMBySearch, setFilterListSearch] = useState<DirectEntity[] | undefined>(listDMInvite);

	const handleFilterListSearch = useCallback(() => {
		if (!searchTerm.trim()) {
			setFilterListSearch(listDMInvite);
			return;
		}

		const listSearch = listDMInvite?.filter((dmGroup) => {
			if (dmGroup.usernames?.toString()?.toLowerCase().includes(searchTerm.toLowerCase())) {
				return dmGroup.usernames?.toString()?.toLowerCase().includes(searchTerm.toLowerCase());
			}
			return dmGroup.channel_label?.toLowerCase().includes(searchTerm.toLowerCase());
		});
		setFilterListSearch(listSearch);
	}, [searchTerm, listDMInvite]);

	useEffect(() => {
		if (!searchTerm.trim()) {
			setFilterListSearch(listDMInvite);
		} else {
			handleFilterListSearch();
		}
	}, [listDMInvite, searchTerm, handleFilterListSearch]);

	const throttledSetSearchTerm = useThrottledCallback(handleFilterListSearch, 300);
	const handleInputChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			setSearchTerm(e.target.value);
			throttledSetSearchTerm();
		},
		[throttledSetSearchTerm]
	);

	const handleSend = (dmGroup: DirectEntity) => {
		setSendIds((ids) => {
			return {
				...ids,
				[dmGroup.id]: true
			};
		});
	};

	const dmGroupChatListRef = useRef(useAppSelector(selectAllDirectMessages));
	///
	const membersClan = useSelector(selectAllMembersInClan);
	const dmGroupChatList = dmGroupChatListRef.current;
	const friends = useSelector(selectAllFriends);

	const dataUserToInvite = useMemo(() => {
		const userData = processUserData(membersClan as UsersClanEntity[], dmGroupChatList as DirectEntity[], friends as FriendsEntity[]);
		const blockedUserIds = new Set(blockedUsers?.map((user) => user.id).filter(Boolean));
		return userData.filter((user) => user?.id && !blockedUserIds.has(user.id));
	}, [membersClan, dmGroupChatList, friends, blockedUsers]);
	const filteredDataToInvite = useMemo(() => {
		if (!searchTerm) {
			return dataUserToInvite;
		}

		return dataUserToInvite.filter(
			(item) =>
				item?.username?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
				item?.clan_nick?.toLowerCase().includes(searchTerm?.toLowerCase())
		);
	}, [searchTerm, dataUserToInvite]);

	return (
		<>
			<input
				type="text"
				value={searchTerm}
				onChange={handleInputChange}
				placeholder={t('searchPlaceholder')}
				className="w-full h-10 mb-1 bg-theme-input  border-theme-primary rounded-lg px-[16px] py-[13px] text-[14px] outline-none"
			/>
			<div className={`py-[10px] cursor-default overflow-y-auto max-h-[200px] overflow-x-hidden thread-scroll `}>
				{isInviteExternalCalling ? (
					<div className="flex flex-col gap-3">
						{filteredDataToInvite?.length > 0 ? (
							filteredDataToInvite.map((user, index) => (
								<ListMemberInviteItem
									dmGroup={undefined}
									user={user as UsersClanEntity}
									key={`${index}${user.id}`}
									url={props.url}
									onSend={handleSend}
									isSent={!!sendIds[user.id as string]}
									isExternalCalling={true}
									usersInviteExternal={user}
								/>
							))
						) : (
							<span>{t('noResults')}</span>
						)}
					</div>
				) : listDMInvite ? (
					<div className="flex flex-col gap-3">
						{filteredListDMBySearch?.map((dmGroup) => (
							<ListMemberInviteItem
								dmGroup={dmGroup}
								key={dmGroup.id}
								url={props.url}
								onSend={handleSend}
								isSent={!!sendIds[dmGroup.id]}
							/>
						))}
					</div>
				) : null}
			</div>
			<hr className="border-t-theme-primary rounded-t " />
		</>
	);
};

export default ListMemberInvite;
