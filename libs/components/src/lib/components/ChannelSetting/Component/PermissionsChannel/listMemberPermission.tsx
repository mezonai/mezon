import { useAppNavigation, useAuth, useCustomNavigate } from '@mezon/core';
import type { removeChannelUsersPayload } from '@mezon/store';
import {
	channelUsersActions,
	selectCurrentClanId,
	selectEntitesUserClans,
	selectRawDataUserGroup,
	selectUserChannelIds,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons, Pagination } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import type { ChangeEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import type { PermissionMemberRow } from './permissionMemberList';
import {
	PERMISSION_LIST_PAGE_SIZE,
	PERMISSION_SEARCH_DEBOUNCE_MS,
	channelUserProfiles,
	clampPage,
	countLabel,
	matchesNeedle,
	pageCount,
	pageSlice,
	permissionMemberRow,
	searchNeedle
} from './permissionMemberList';

type ListMemberPermissionProps = {
	channel: IChannel;
	selectedUserIds: string[];
	setSelectedUserIds?: (userIds: string[]) => void;
};

const ListMemberPermission = (props: ListMemberPermissionProps) => {
	const { channel, selectedUserIds, setSelectedUserIds } = props;
	const { t } = useTranslation('channelSetting');

	const dispatch = useAppDispatch();
	const idUsers = useSelector((state) => selectUserChannelIds(state, channel.id));
	const channelUsers = useAppSelector((state) => selectRawDataUserGroup(state, channel.id));
	const rosterMembers = useSelector(selectEntitesUserClans);
	const currentClanId = useSelector(selectCurrentClanId);
	const navigate = useCustomNavigate();
	const userProfile = useAuth();
	const { toMembersPage } = useAppNavigation();
	// The field shows every keystroke; the list filters by the query once typing pauses.
	const [query, setQuery] = useState('');
	const [appliedQuery, setAppliedQuery] = useState('');
	const [page, setPage] = useState(0);

	const displayUserIds = useMemo(() => {
		const sourceIds = channel.channel_private === 1 ? idUsers : selectedUserIds;
		return Array.from(new Set(sourceIds.filter(Boolean)));
	}, [channel.channel_private, idUsers, selectedUserIds]);
	const profiles = useMemo(() => channelUserProfiles(channelUsers), [channelUsers]);
	const rows = useMemo(
		() => displayUserIds.map((id) => permissionMemberRow(id, rosterMembers[id], profiles[id])),
		[displayUserIds, rosterMembers, profiles]
	);
	const needle = searchNeedle(appliedQuery);
	const visibleRows = useMemo(() => (needle ? rows.filter((row) => matchesNeedle(needle, row.keywords)) : rows), [rows, needle]);
	const currentPage = clampPage(page, visibleRows.length);
	const pageRows = useMemo(() => pageSlice(visibleRows, currentPage), [visibleRows, currentPage]);
	const totalPages = pageCount(visibleRows.length);
	const hasMembers = rows.length > 0;
	const hasMatches = visibleRows.length > 0;
	// A list longer than one page keeps one page of height whatever it shows, so neither
	// paging nor a narrowing search moves the pager or what sits below it.
	const listClassName = rows.length > PERMISSION_LIST_PAGE_SIZE ? 'min-h-[384px]' : '';
	const count = countLabel(visibleRows.length, rows.length);

	const deleteMember = useCallback(
		async (userId: string) => {
			if (channel.channel_private !== 1) {
				setSelectedUserIds?.(selectedUserIds.filter((selectedId) => selectedId !== userId));
				return;
			}

			if (!idUsers.includes(userId)) {
				return;
			}
			const body: removeChannelUsersPayload = {
				channelId: channel.id,
				userId,
				channelType: channel.type,
				clanId: currentClanId as string
			};
			await dispatch(channelUsersActions.removeChannelUsers(body));
			setSelectedUserIds?.(selectedUserIds.filter((selectedId) => selectedId !== userId));
			if (currentClanId && userId === userProfile.userId) {
				navigate(toMembersPage(currentClanId));
			}
		},
		[channel, idUsers, selectedUserIds, setSelectedUserIds, currentClanId, dispatch, userProfile.userId, navigate, toMembersPage]
	);

	const applyQuery = useDebouncedCallback((value: string) => {
		setAppliedQuery(value);
		setPage(0);
	}, PERMISSION_SEARCH_DEBOUNCE_MS);

	const handleSearchChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value;
			setQuery(value);
			applyQuery(value);
			// Clearing the field brings the full list back at once.
			if (!value.trim()) {
				applyQuery.flush();
			}
		},
		[applyQuery]
	);

	const handlePageChange = useCallback((nextPage: number) => {
		setPage(nextPage - 1);
	}, []);

	return (
		<div className="py-4">
			<div className="flex items-center justify-between gap-3 pb-4">
				<div className="flex items-center gap-2 min-w-0 text-xs font-bold text-theme-primary">
					<p className="uppercase truncate">{t('channelPermission.members')}</p>
					{hasMembers && <span className="shrink-0 px-2 rounded-full bg-item-theme">{count}</span>}
				</div>
				<div className="flex items-center gap-2 w-[220px] h-[30px] shrink-0 px-2 rounded-lg bg-input-secondary">
					<Icons.Search className="w-4 h-4 shrink-0 text-theme-primary" />
					<input
						type="text"
						value={query}
						onChange={handleSearchChange}
						placeholder={t('channelPermission.searchMembers')}
						className="flex-1 min-w-0 bg-transparent outline-none text-sm text-theme-message"
					/>
				</div>
			</div>
			<div className={listClassName} data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.member_list')}>
				{hasMatches &&
					pageRows.map((row) => (
						<ItemMemberPermission key={row.id} row={row} onDelete={deleteMember} channelOwner={channel.creator_id === row.id} />
					))}
				{hasMembers && !hasMatches && (
					<div className="flex items-center justify-center h-[384px] text-sm text-theme-primary">
						{t('channelPermission.noMembersFound')}
					</div>
				)}
			</div>
			{totalPages > 1 && (
				<div className="pt-3">
					<Pagination totalPages={totalPages} currentPage={currentPage + 1} onPageChange={handlePageChange} />
				</div>
			)}
		</div>
	);
};

export default ListMemberPermission;

type ItemMemberPermissionProps = {
	row: PermissionMemberRow;
	onDelete: (userId: string) => void;
	channelOwner?: boolean;
};

const ItemMemberPermission = memo((props: ItemMemberPermissionProps) => {
	const { row, onDelete, channelOwner } = props;
	const { t } = useTranslation('channelSetting');
	const showUsername = !!row.username && row.username !== row.name;
	const removeLabel = t('channelPermission.removeMember');

	const handleDelete = useCallback(() => {
		onDelete(row.id);
	}, [onDelete, row.id]);

	return (
		<div
			className="group flex items-center justify-between gap-3 h-12 rounded text-theme-primary"
			data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.member_list.member_item')}
		>
			<div className="flex flex-1 min-w-0 gap-x-2 items-center">
				<AvatarImage
					alt={row.name}
					username={row.username || row.name}
					className="min-w-8 min-h-8 max-w-8 max-h-8"
					srcImgProxy={createImgproxyUrl(row.avatar)}
					src={row.avatar}
					classNameText="text-[11px] pt-[3px]"
				/>
				<div className="flex flex-col flex-1 min-w-0">
					<p className="truncate text-sm font-semibold text-theme-primary-active">{row.name}</p>
					{showUsername && <p className="truncate text-xs">{row.username}</p>}
				</div>
			</div>
			<div className="flex items-center gap-x-2 shrink-0">
				{channelOwner && <p className="text-xs">{t('channelPermission.ChannelCreator')}</p>}
				{!channelOwner && (
					<button
						onClick={handleDelete}
						title={removeLabel}
						aria-label={removeLabel}
						className="flex items-center justify-center size-8 rounded-md hover:text-red-500"
					>
						<Icons.EscIcon className="size-[15px]" />
					</button>
				)}
			</div>
		</div>
	);
});
