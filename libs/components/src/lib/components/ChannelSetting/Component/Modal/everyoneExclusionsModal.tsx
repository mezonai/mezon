import { useEscapeKeyClose } from '@mezon/core';
import type { AddedChannelUserProfile, EveryoneExcludeKind } from '@mezon/store';
import { selectAllRolesClan, selectAllUserClans, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { KeyboardEvent } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rankByMatch, searchNeedle, serverRowsFor } from '../PermissionsChannel/permissionMemberList';
import { clanUserFromMentionUser, memberNames, useRemoteClanMembers } from '../useRemoteClanMembers';
import ListMembers from './listMembers';
import ListRoles from './listRoles';

type Props = {
	clanId: string;
	channelName: string;
	kind: EveryoneExcludeKind;
	userIds: string[];
	roleIds: string[];
	profiles: Record<string, AddedChannelUserProfile>;
	onCancel: () => void;
	onDone: (kind: EveryoneExcludeKind, ids: string[], profiles: Record<string, AddedChannelUserProfile>) => void;
};

const EveryoneExclusionsModal = ({ clanId, channelName, kind: initialKind, userIds, roleIds, profiles, onCancel, onDone }: Props) => {
	const { t } = useTranslation('channelSetting');
	const id = useId();
	const modalRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const [kind, setKind] = useState(initialKind);
	const [selections, setSelections] = useState({ users: [...userIds], roles: [...roleIds] });
	const selected = selections[kind];
	const [query, setQuery] = useState('');
	const roles = useAppSelector(selectAllRolesClan);
	const members = useAppSelector(selectAllUserClans);
	const remote = useRemoteClanMembers(kind === 'users' ? query : '');
	useEscapeKeyClose(modalRef, onCancel);
	useEffect(() => {
		searchRef.current?.focus();
	}, []);

	const needle = searchNeedle(query);
	const roleRows = useMemo(() => {
		const candidates = roles.filter((role) => role.creator_id !== '0' && role.slug !== `everyone-${clanId}`);
		const named = candidates.map((role) => ({ ...role, display_name: role.title || '' }));
		return rankByMatch(serverRowsFor({ needle: '', users: named }, needle), needle, (role) => [role.title]);
	}, [roles, clanId, needle]);
	const memberRows = useMemo(() => {
		const rows = new Map(members.filter((member) => member.id && member.id !== '0').map((member) => [member.id, member]));
		for (const user of remote.users) {
			if (user.id && user.id !== '0' && !rows.has(user.id)) rows.set(user.id, clanUserFromMentionUser(user));
		}
		for (const userId of userIds) {
			if (!rows.has(userId)) {
				const profile = profiles[userId];
				rows.set(userId, {
					id: userId,
					user: { username: profile?.username || userId, display_name: profile?.display_name, avatar_url: profile?.avatar }
				});
			}
		}
		const named = [...rows.values()].map((member) => ({
			...member,
			display_name: member.user?.display_name,
			username: member.user?.username
		}));
		return rankByMatch(serverRowsFor({ needle: '', users: named }, needle), needle, memberNames);
	}, [members, remote.users, userIds, profiles, needle]);

	const changeKind = (next: EveryoneExcludeKind) => {
		if (next === kind) return;
		setKind(next);
	};
	const choose = (checked: boolean, value: string) => {
		setSelections((previous) => ({
			...previous,
			[kind]: checked ? [...new Set([...previous[kind], value])] : previous[kind].filter((entry) => entry !== value)
		}));
	};
	const submit = () => {
		const picked = { ...profiles, ...remote.profilesOf(kind === 'users' ? selected : []) };
		onDone(kind, selected, picked);
	};
	const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'Tab') return;
		const controls = modalRef.current?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled), [tabindex="0"]');
		if (!controls?.length) return;
		const first = controls[0];
		const last = controls[controls.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60" />
			<div
				ref={modalRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={`${id}-title`}
				onKeyDown={trapFocus}
				tabIndex={-1}
				className="relative flex flex-col w-[440px] max-w-full max-h-[calc(100vh-32px)] p-6 rounded-[5px] bg-theme-setting-primary text-theme-primary"
				data-e2e={generateE2eId('channel_setting_page.permissions.exclusions.modal')}
			>
				<h2 id={`${id}-title`} className="text-2xl font-semibold text-center text-theme-primary-active">
					{t('addMembersRoles.title')}
				</h2>
				<div className="flex items-center justify-center gap-1 mt-1">
					<Icons.Hashtag className="size-5" />
					<span className="truncate">{channelName}</span>
				</div>
				<div className="py-3">
					<input
						ref={searchRef}
						type="text"
						value={query}
						placeholder={t('addMembersRoles.placeholder')}
						aria-label={t('addMembersRoles.searchPlaceholder')}
						onChange={(event) => {
							setQuery(event.target.value);
							if (event.target.value.trim().startsWith('@')) changeKind('users');
						}}
						className="w-full rounded-lg px-3 py-2 outline-none bg-input-secondary text-theme-message"
					/>
					<p className="pt-2 text-xs">{t('addMembersRoles.instruction')}</p>
				</div>
				<div role="tablist" aria-label={t('addMembersRoles.title')} className="flex border-b-theme-primary">
					{(['roles', 'users'] as const).map((tab) => (
						<button
							key={tab}
							type="button"
							role="tab"
							id={`${id}-${tab}`}
							aria-selected={kind === tab}
							aria-controls={`${id}-panel`}
							onClick={() => changeKind(tab)}
							className={`px-3 py-2 text-sm border-b-2 ${
								kind === tab ? 'border-indigo-500 text-theme-primary-active' : 'border-transparent'
							}`}
						>
							{t(tab === 'roles' ? 'addMembersRoles.roles' : 'addMembersRoles.members')}
						</button>
					))}
				</div>
				<div
					role="tabpanel"
					id={`${id}-panel`}
					aria-labelledby={`${id}-${kind}`}
					className="h-[270px] min-h-0 overflow-y-auto py-4 hide-scrollbar"
				>
					<p className="uppercase font-bold text-xs pb-4">{t(kind === 'roles' ? 'addMembersRoles.roles' : 'addMembersRoles.members')}</p>
					{kind === 'roles' ? (
						<ListRoles
							listItem={roleRows}
							selectedRoleIds={selected}
							handleCheckboxRoleChange={(event, roleId) => choose(event.target.checked, roleId)}
						/>
					) : (
						<ListMembers
							listItem={memberRows}
							selectedUserIds={selected}
							handleCheckboxUserChange={(event, userId) => choose(event.target.checked, userId)}
						/>
					)}
					{kind === 'users' && remote.pending && (
						<p role="status" className="text-sm">
							{t('channelPermission.loading')}
						</p>
					)}
					{(kind === 'roles' ? roleRows.length === 0 : memberRows.length === 0 && !remote.pending) && (
						<p className="text-sm">{t('channelPermission.noExclusionsFound')}</p>
					)}
				</div>
				<div className="flex justify-center gap-5 mt-10 text-sm">
					<button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
						{t('addMembersRoles.cancel')}
					</button>
					<button type="button" onClick={submit} className="px-4 py-2 rounded-lg btn-primary btn-primary-hover">
						{t('addMembersRoles.done')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default EveryoneExclusionsModal;
