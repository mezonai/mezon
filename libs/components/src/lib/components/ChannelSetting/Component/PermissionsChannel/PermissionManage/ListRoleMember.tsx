import type { RolesClanEntity } from '@mezon/store';
import { channelUsersActions, selectChannelById, selectCurrentClanId, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { UsersClanEntity } from '@mezon/utils';
import {
	DEFAULT_ROLE_COLOR,
	createImgproxyUrl,
	generateE2eId,
	getAvatarForPrioritize,
	getNameForPrioritize,
	searchNormalizeText
} from '@mezon/utils';
import type { ChangeEvent, MouseEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { AvatarImage } from '../../../../AvatarImage/AvatarImage';
import type { PermissionMemberRow } from '../permissionMemberList';
import {
	PERMISSION_LIST_PAGE_SIZE,
	PERMISSION_SEARCH_DEBOUNCE_MS,
	clampPage,
	countLabel,
	matchesNeedle,
	pageCount,
	pageSlice,
	searchNeedle
} from '../permissionMemberList';

export type PermissionEntityRow = {
	id: string;
	title: string;
	/** Second line for a member: the username the roster or the channel listing carries. */
	subtitle: string;
	type: number;
	role?: RolesClanEntity;
	member?: PermissionMemberRow;
};

type ListRoleMemberProps = {
	listManageInChannel: PermissionEntityRow[];
	listRolesNotInChannel: RolesClanEntity[];
	listUsersNotInChannel: UsersClanEntity[];
	channelId: string;
	selectedId?: string;
	onSelect: (id: string, type: number) => void;
	/** Starts loading an entity's overrides while the pointer rests on it, before the click. */
	onPrefetch: (id: string, type: number) => void;
};

const PAGER_BUTTON_CLASS =
	'w-10 h-8 flex items-center justify-center rounded-md border text-theme-primary border-theme-primary btn-primary btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed';

const entityKeywords = (row: PermissionEntityRow) => row.member?.keywords ?? [row.title];

const ListRoleMember = memo((props: ListRoleMemberProps) => {
	const { listManageInChannel, listRolesNotInChannel, listUsersNotInChannel, channelId, selectedId, onSelect, onPrefetch } = props;
	const { t } = useTranslation('channelSetting');
	const [query, setQuery] = useState('');
	const [appliedQuery, setAppliedQuery] = useState('');
	const [page, setPage] = useState(0);

	const needle = searchNeedle(appliedQuery);
	const visibleRows = useMemo(
		() => (needle ? listManageInChannel.filter((row) => matchesNeedle(needle, entityKeywords(row))) : listManageInChannel),
		[listManageInChannel, needle]
	);
	const currentPage = clampPage(page, visibleRows.length);
	const pageRows = useMemo(() => pageSlice(visibleRows, currentPage), [visibleRows, currentPage]);
	const totalPages = pageCount(visibleRows.length);
	const hasEntities = listManageInChannel.length > 0;
	const hasMatches = visibleRows.length > 0;
	const count = hasEntities ? countLabel(visibleRows.length, listManageInChannel.length) : '';
	const listClassName = listManageInChannel.length > PERMISSION_LIST_PAGE_SIZE ? 'mt-2 min-h-[384px]' : 'mt-2';
	const pageLabel = `${currentPage + 1} / ${totalPages}`;

	const applyQuery = useDebouncedCallback((value: string) => {
		setAppliedQuery(value);
		setPage(0);
	}, PERMISSION_SEARCH_DEBOUNCE_MS);

	const handleSearchChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value;
			setQuery(value);
			applyQuery(value);
			if (!value.trim()) {
				applyQuery.flush();
			}
		},
		[applyQuery]
	);

	const handlePreviousPage = useCallback(() => {
		setPage(Math.max(0, currentPage - 1));
	}, [currentPage]);

	const handleNextPage = useCallback(() => {
		setPage(Math.min(totalPages - 1, currentPage + 1));
	}, [currentPage, totalPages]);

	return (
		<div className="w-[260px] shrink-0">
			<HeaderAddRoleMember
				count={count}
				listRolesNotInChannel={listRolesNotInChannel}
				listUsersNotInChannel={listUsersNotInChannel}
				channelId={channelId}
			/>
			<div className="flex items-center gap-2 mt-2 h-[28px] px-2 rounded-lg bg-input-secondary">
				<Icons.Search className="w-4 h-4 shrink-0 text-theme-primary" />
				<input
					type="text"
					value={query}
					onChange={handleSearchChange}
					placeholder={t('addMembersRoles.searchPlaceholder')}
					className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-theme-message"
				/>
			</div>
			<div className={listClassName} data-e2e={generateE2eId('channel_setting_page.permissions.section.list_roles_members')}>
				{hasMatches &&
					pageRows.map((item) => (
						<EntityRow key={item.id} row={item} selected={selectedId === item.id} onSelect={onSelect} onPrefetch={onPrefetch} />
					))}
				{hasEntities && !hasMatches && <p className="py-2 text-sm text-theme-primary">{t('channelPermission.noMembersFound')}</p>}
			</div>
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-1 pt-2 text-theme-primary">
					<button className={PAGER_BUTTON_CLASS} disabled={currentPage === 0} onClick={handlePreviousPage}>
						<Icons.ArrowRight className="rotate-180" />
					</button>
					<span className="w-[88px] shrink-0 text-center text-sm">{pageLabel}</span>
					<button className={PAGER_BUTTON_CLASS} disabled={currentPage + 1 >= totalPages} onClick={handleNextPage}>
						<Icons.ArrowRight />
					</button>
				</div>
			)}
		</div>
	);
});

export default ListRoleMember;

type EntityRowProps = {
	row: PermissionEntityRow;
	selected: boolean;
	onSelect: (id: string, type: number) => void;
	onPrefetch: (id: string, type: number) => void;
};

const EntityRow = memo(({ row, selected, onSelect, onPrefetch }: EntityRowProps) => {
	const showSubtitle = !!row.subtitle && row.subtitle !== row.title;

	const handleClick = useCallback(() => {
		onSelect(row.id, row.type);
	}, [onSelect, row.id, row.type]);

	const handleMouseEnter = useCallback(() => {
		onPrefetch(row.id, row.type);
	}, [onPrefetch, row.id, row.type]);

	return (
		<div
			role="button"
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			className={`w-full h-12 px-[10px] text-theme-primary bg-item-hover font-medium flex gap-x-2 items-center rounded cursor-pointer ${
				selected ? 'bg-item-theme' : ''
			}`}
			data-e2e={generateE2eId('channel_setting_page.permissions.section.list_roles_members.role_member_item')}
		>
			<EntityGlyph row={row} />
			<div className="flex flex-col flex-1 min-w-0">
				<p className="truncate text-sm">{row.title}</p>
				{showSubtitle && <p className="truncate text-xs opacity-80">{row.subtitle}</p>}
			</div>
		</div>
	);
});

// Same shape as the member list above, so a name means the same thing in both places.
const EntityGlyph = ({ row }: { row: PermissionEntityRow }) => {
	if (row.member) {
		return (
			<AvatarImage
				alt={row.member.name}
				username={row.member.username || row.member.name}
				className="min-w-6 min-h-6 max-w-6 max-h-6"
				srcImgProxy={createImgproxyUrl(row.member.avatar)}
				src={row.member.avatar}
				classNameText="text-[9px] pt-[3px]"
			/>
		);
	}
	if (row.role?.role_icon) {
		return <img src={row.role.role_icon} alt={row.title} className="w-6 h-6 min-w-6 rounded" />;
	}
	return <Icons.RoleIcon className="w-6 h-6 min-w-6" defaultFill1={row.role?.color || DEFAULT_ROLE_COLOR} />;
};

type HeaderAddRoleMemberProps = {
	count: string;
	listRolesNotInChannel: RolesClanEntity[];
	listUsersNotInChannel: UsersClanEntity[];
	channelId: string;
};

const HeaderAddRoleMember = memo((props: HeaderAddRoleMemberProps) => {
	const { count, listRolesNotInChannel, listUsersNotInChannel, channelId } = props;
	const { t } = useTranslation('channelSetting');
	const [showPopup, setShowPopup] = useState(false);

	const channel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const channelIdInStore = channel.id;
	const channelType = channel.type;
	const addRole = useCallback(
		async (roleId: string) => {
			const body = {
				clanId: currentClanId || '',
				channelId: channelIdInStore,
				roleIds: [roleId],
				channelType
			};
			await dispatch(channelUsersActions.addChannelRoles(body));
		},
		[currentClanId, channelIdInStore, channelType, dispatch]
	);

	const addUser = useCallback(
		async (userId: string) => {
			const body = {
				channelId: channelIdInStore,
				channelType,
				userIds: [userId],
				clanId: currentClanId || ''
			};
			await dispatch(channelUsersActions.addChannelUsers(body));
		},
		[currentClanId, channelIdInStore, channelType, dispatch]
	);

	const [search, setSearch] = useState('');
	const [appliedSearch, setAppliedSearch] = useState('');
	const applySearch = useDebouncedCallback((value: string) => {
		setAppliedSearch(value);
	}, PERMISSION_SEARCH_DEBOUNCE_MS);

	const handleSearchChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value;
			setSearch(value);
			applySearch(value);
			if (!value.trim()) {
				applySearch.flush();
			}
		},
		[applySearch]
	);

	const listRoleCanAdd = useMemo(() => {
		if (!appliedSearch) {
			return listRolesNotInChannel;
		}
		return listRolesNotInChannel.filter((role) => searchNormalizeText(role.title, appliedSearch));
	}, [appliedSearch, listRolesNotInChannel]);

	// Members already on the channel are left out: adding them again would do nothing.
	const listMemberCanAdd = useMemo(() => {
		if (!appliedSearch) {
			return listUsersNotInChannel;
		}
		return listUsersNotInChannel.filter(
			(user) =>
				searchNormalizeText(user?.clan_nick || '', appliedSearch) ||
				searchNormalizeText(user.user?.display_name || '', appliedSearch) ||
				searchNormalizeText(user.user?.username || '', appliedSearch)
		);
	}, [appliedSearch, listUsersNotInChannel]);

	// Only the button opens the panel: the whole header used to, so a click on the label alone popped it up.
	const togglePopup = useCallback(() => {
		setShowPopup((shown) => !shown);
	}, []);

	const closePopup = useCallback((event: MouseEvent) => {
		event.stopPropagation();
		setShowPopup(false);
	}, []);

	const closeAfterPick = useCallback(() => {
		setShowPopup(false);
	}, []);

	return (
		<div className="flex justify-between items-center gap-2 relative">
			<div className="flex items-center gap-2 min-w-0 text-xs font-bold text-theme-primary-active">
				<h4 className="uppercase truncate">{t('channelPermission.bottomSheet.rolesMembers')}</h4>
				{count && <span className="shrink-0 px-2 rounded-full bg-item-theme text-theme-primary">{count}</span>}
			</div>
			{channel?.channel_private === 1 && (
				<button
					onClick={togglePopup}
					title={t('channelPermission.bottomSheet.add')}
					aria-label={t('channelPermission.bottomSheet.add')}
					className="shrink-0 cursor-pointer"
				>
					<Icons.PlusIcon className="size-4" />
				</button>
			)}
			{showPopup && (
				<>
					<div className="fixed inset-0 z-40 cursor-default" onClick={closePopup} />
					<div
						className="absolute top-9 right-0 w-64 rounded-lg overflow-hidden bg-theme-setting-primary border-theme-primary shadow-lg z-50 cursor-default"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center gap-2 p-2 text-sm bg-theme-setting-nav">
							<Icons.Search className="w-4 h-4 shrink-0 text-theme-primary" />
							<input
								type="text"
								className="flex-1 min-w-0 bg-transparent outline-none font-medium"
								placeholder={t('channelPermission.bottomSheet.roleMemberPlaceholder')}
								value={search}
								onChange={handleSearchChange}
							/>
						</div>
						<AddCandidateList
							roles={listRoleCanAdd}
							members={listMemberCanAdd}
							onAddRole={addRole}
							onAddUser={addUser}
							onPicked={closeAfterPick}
						/>
					</div>
				</>
			)}
		</div>
	);
});

type AddCandidateListProps = {
	roles: RolesClanEntity[];
	members: UsersClanEntity[];
	onAddRole: (roleId: string) => void;
	onAddUser: (userId: string) => void;
	onPicked: () => void;
};

// Memoized apart from the search field: the field re-renders the panel on every keystroke, while
// the list — up to the roster's 1000 members — only has to follow the debounced filter.
const AddCandidateList = memo(({ roles, members, onAddRole, onAddUser, onPicked }: AddCandidateListProps) => {
	const { t } = useTranslation('channelSetting');
	const hasCandidates = roles.length > 0 || members.length > 0;

	return (
		<div className="p-2 h-64 overflow-y-scroll hide-scrollbar text-theme-primary" onClick={onPicked}>
			{!hasCandidates && <p className="p-2 text-sm">{t('channelPermission.noMembersFound')}</p>}
			{roles.length > 0 && (
				<div>
					<p className="px-3 py-2 uppercase text-[11px] font-bold">{t('channelPermission.bottomSheet.roles')}</p>
					{roles.map((item) => (
						<div
							key={item.id}
							className="rounded px-3 py-2 font-semibold bg-item-hover text-theme-primary-hover cursor-pointer"
							onClick={() => onAddRole(item.id)}
						>
							{item.title}
						</div>
					))}
				</div>
			)}
			{members.length > 0 && (
				<div>
					<p className="px-3 py-2 uppercase text-[11px] font-bold">{t('channelPermission.bottomSheet.members')}</p>
					{members.map((item) => (
						<div key={item.id} onClick={() => onAddUser(item.id)}>
							<ItemUser
								username={item.user?.username}
								displayName={item.user?.display_name}
								clanName={item.clan_nick}
								avatar={item.user?.avatar_url}
								avatarClan={item.clan_avatar}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
});

type ItemUserProps = {
	username?: string;
	displayName?: string;
	clanName?: string;
	avatar?: string;
	avatarClan?: string;
};

const ItemUser = (props: ItemUserProps) => {
	const { username = '', displayName = '', clanName = '', avatar = '', avatarClan = '' } = props;
	const namePrioritize = getNameForPrioritize(clanName, displayName, username);
	const avatarPrioritize = getAvatarForPrioritize(avatarClan, avatar);
	return (
		<div className="rounded px-3 py-2 font-semibold dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton dark:hover:text-white hover:text-black flex items-center gap-x-2">
			<AvatarImage
				alt={username}
				username={username}
				className="min-w-8 min-h-8 max-w-8 max-h-8"
				srcImgProxy={createImgproxyUrl(avatarPrioritize ?? '')}
				src={avatarPrioritize}
			/>
			<p className="font-medium">{namePrioritize}</p>
		</div>
	);
};
