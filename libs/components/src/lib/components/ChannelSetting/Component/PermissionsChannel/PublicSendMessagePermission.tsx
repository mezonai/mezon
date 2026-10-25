import type { AddedChannelUserProfile, EveryoneExcludeKind } from '@mezon/store';
import {
	fetchOverrideEveryoneChannel,
	fetchUsersClan,
	overriddenPoliciesActions,
	rolesClanActions,
	selectAllRolesClan,
	selectEntitesUserClans,
	selectRawDataUserGroup,
	setOverrideEveryoneChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import type { ApiGetOverrideEveryoneChannelResponse } from 'mezon-js';
import type { MutableRefObject, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import EveryoneExclusionsModal from '../Modal/everyoneExclusionsModal';
import { channelUserProfiles, permissionMemberRow } from './permissionMemberList';

type Props = {
	clanId: string;
	channelId: string;
	channelName: string;
	isSaving: boolean;
	onDirtyChange: (dirty: boolean) => void;
	onModalChange: (open: boolean) => void;
	saveTriggerRef: MutableRefObject<(() => Promise<void> | void) | null>;
	resetTriggerRef: MutableRefObject<(() => void) | null>;
	preparePrivateRef: MutableRefObject<(() => Promise<void>) | null>;
};

type ExceptionRowProps = {
	id: string;
	kind: EveryoneExcludeKind;
	removeLabel: string;
	disabled: boolean;
	onRemove: () => void;
	children: ReactNode;
};

const ExceptionRow = ({ id, kind, removeLabel, disabled, onRemove, children }: ExceptionRowProps) => (
	<div data-exception-kind={kind} data-exception-id={id} className="flex items-center justify-between gap-2 py-2 text-theme-primary">
		<div className="flex items-center gap-2 min-w-0">{children}</div>
		<button
			type="button"
			disabled={disabled}
			aria-label={removeLabel}
			onClick={onRemove}
			className="p-2 rounded hover:bg-item-hover disabled:opacity-50"
			data-e2e={generateE2eId(
				kind === 'users'
					? 'channel_setting_page.permissions.exclusions.remove_member'
					: 'channel_setting_page.permissions.exclusions.remove_role'
			)}
		>
			<Icons.EscIcon className="size-[15px]" />
		</button>
	</div>
);

const cleanIds = (ids: string[] = []) => [...new Set(ids.filter((id) => id && id !== '0'))];
const sameIds = (left: string[], right: string[] = []) => {
	if (left.length !== right.length) return false;
	const known = new Set(right);
	return left.every((id) => known.has(id));
};
const kindOf = (users: string[], roles: string[]): EveryoneExcludeKind => (users.length === 0 && roles.length > 0 ? 'roles' : 'users');

const PublicSendMessagePermission = ({
	clanId,
	channelId,
	channelName,
	isSaving,
	onDirtyChange,
	onModalChange,
	saveTriggerRef,
	resetTriggerRef,
	preparePrivateRef
}: Props) => {
	const { t } = useTranslation('channelSetting');
	const dispatch = useAppDispatch();
	const roles = useAppSelector(selectAllRolesClan);
	const roster = useAppSelector(selectEntitesUserClans);
	const listing = useAppSelector((state) => selectRawDataUserGroup(state, channelId));
	const profiles = channelUserProfiles(listing);
	const [stagedProfiles, setStagedProfiles] = useState<Record<string, AddedChannelUserProfile>>({});
	const [persisted, setPersisted] = useState<ApiGetOverrideEveryoneChannelResponse | null>(null);
	const [userIds, setUserIds] = useState<string[]>([]);
	const [roleIds, setRoleIds] = useState<string[]>([]);
	const [kind, setKind] = useState<EveryoneExcludeKind>('users');
	const [initialKind, setInitialKind] = useState<EveryoneExcludeKind>('users');
	const [value, setValue] = useState(false);
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const [reload, setReload] = useState(0);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);
	const loadRef = useRef<Promise<ApiGetOverrideEveryoneChannelResponse> | null>(null);
	const savingRef = useRef(false);
	const generationRef = useRef(0);
	const initial = persisted ? persisted.override === true : null;
	const usersChanged = !sameIds(userIds, persisted?.user_ids);
	const rolesChanged = !sameIds(roleIds, persisted?.role_ids);
	const dirty = initial !== null && (value !== initial || (value && (usersChanged || rolesChanged || kind !== initialKind)));
	const busy = isSaving || saving;
	const canEdit = status === 'ready' && !busy;

	useEffect(() => {
		let active = true;
		generationRef.current += 1;
		savingRef.current = false;
		setSaving(false);
		setPersisted(null);
		setUserIds([]);
		setRoleIds([]);
		setKind('users');
		setInitialKind('users');
		setStagedProfiles({});
		setShowModal(false);
		loadRef.current = null;
		setSaveError(null);
		setValue(false);
		setStatus('loading');
		if (!clanId || !channelId) {
			setStatus('error');
			return;
		}
		const request = dispatch(fetchOverrideEveryoneChannel({ clanId, channelId })).unwrap();
		loadRef.current = request;
		request
			.then((response) => {
				if (!active) return;
				const users = cleanIds(response.user_ids);
				const loadedRoles = cleanIds(response.role_ids);
				const loadedKind = kindOf(users, loadedRoles);
				setPersisted({ ...response, user_ids: users, role_ids: loadedRoles });
				setUserIds(users);
				setRoleIds(loadedRoles);
				setKind(loadedKind);
				setInitialKind(loadedKind);
				setValue(response.override === true);
				setStatus('ready');
			})
			.catch(() => {
				if (active) setStatus('error');
			});
		return () => {
			active = false;
			generationRef.current += 1;
		};
	}, [clanId, channelId, dispatch, reload]);

	useEffect(() => {
		if (!value) return;
		dispatch(rolesClanActions.fetchRolesClan({ clanId }));
		dispatch(fetchUsersClan({ clanId }));
	}, [value, clanId, dispatch]);

	useEffect(() => {
		onModalChange(showModal);
		return () => onModalChange(false);
	}, [showModal, onModalChange]);

	const handleReset = useCallback(() => {
		if (!persisted || savingRef.current) return;
		setValue(persisted.override === true);
		setUserIds([...(persisted.user_ids ?? [])]);
		setRoleIds([...(persisted.role_ids ?? [])]);
		setKind(initialKind);
		setSaveError(null);
		setShowModal(false);
	}, [persisted, initialKind]);

	const handleSave = useCallback(async () => {
		if (status !== 'ready' || !persisted || !dirty || savingRef.current) return;
		const generation = generationRef.current;
		const calls: EveryoneExcludeKind[] = [];
		if (!value) calls.push('users');
		else {
			if (usersChanged) calls.push('users');
			if (rolesChanged) calls.push('roles');
			if (calls.length === 0) calls.push(kind);
		}
		let next = persisted;
		let wrote = false;
		savingRef.current = true;
		setSaving(true);
		setSaveError(null);
		try {
			for (const excludeType of calls) {
				await dispatch(
					setOverrideEveryoneChannel({
						clanId,
						channelId,
						override: value,
						userIds,
						roleIds,
						excludeType
					})
				).unwrap();
				wrote = true;
				next = value
					? { ...next, override: true, ...(excludeType === 'users' ? { user_ids: [...userIds] } : { role_ids: [...roleIds] }) }
					: { ...next, override: false, user_ids: [], role_ids: [] };
				if (generationRef.current === generation) setPersisted(next);
			}
			if (generationRef.current === generation) {
				setInitialKind(value ? kind : 'users');
				if (!value) {
					setKind('users');
					setUserIds([]);
					setRoleIds([]);
					setStagedProfiles({});
				}
			}
		} catch (error) {
			if (generationRef.current === generation) {
				setSaveError(
					typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
						? error.message
						: t('channelPermission.toast.failed')
				);
			}
		} finally {
			if (wrote) dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId, channelId, noCache: true }));
			if (generationRef.current === generation) {
				savingRef.current = false;
				setSaving(false);
			}
		}
	}, [status, persisted, dirty, value, usersChanged, rolesChanged, kind, clanId, channelId, userIds, roleIds, dispatch, t]);

	const handlePreparePrivate = useCallback(async () => {
		const generation = generationRef.current;
		const current = persisted ?? (await (loadRef.current ?? dispatch(fetchOverrideEveryoneChannel({ clanId, channelId })).unwrap()));
		if (current.override !== true) return;
		await dispatch(setOverrideEveryoneChannel({ clanId, channelId, override: false })).unwrap();
		if (generationRef.current === generation) {
			setPersisted({ ...current, override: false, user_ids: [], role_ids: [] });
			setValue(false);
			setUserIds([]);
			setRoleIds([]);
			setKind('users');
			setInitialKind('users');
			setStatus('ready');
			setSaveError(null);
			setShowModal(false);
		}
		dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId, channelId, noCache: true }));
	}, [persisted, clanId, channelId, dispatch]);

	useEffect(() => {
		preparePrivateRef.current = handlePreparePrivate;
		return () => {
			preparePrivateRef.current = null;
		};
	}, [preparePrivateRef, handlePreparePrivate]);
	useEffect(() => {
		onDirtyChange(dirty);
	}, [dirty, onDirtyChange]);
	useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
	useEffect(() => {
		saveTriggerRef.current = handleSave;
		resetTriggerRef.current = handleReset;
		return () => {
			saveTriggerRef.current = null;
			resetTriggerRef.current = null;
		};
	}, [handleSave, handleReset, saveTriggerRef, resetTriggerRef]);

	const applySelection = (selectedKind: EveryoneExcludeKind, ids: string[], pickedProfiles: Record<string, AddedChannelUserProfile>) => {
		setKind(selectedKind);
		if (selectedKind === 'users') setUserIds(cleanIds(ids));
		else setRoleIds(cleanIds(ids));
		setStagedProfiles((previous) => ({ ...previous, ...pickedProfiles }));
		setShowModal(false);
		setSaveError(null);
	};

	const removeException = (kind: EveryoneExcludeKind, id: string) => {
		const setIds = kind === 'users' ? setUserIds : setRoleIds;
		setIds((ids) => ids.filter((entry) => entry !== id));
		setSaveError(null);
	};

	return (
		<>
			<div className="mt-4 p-4 bg-theme-setting-nav border-theme-primary border-1 rounded-lg">
				<label className="flex justify-between items-center gap-4">
					<span className="font-bold text-theme-primary">{t('channelPermission.preventEveryoneSendMessages')}</span>
					<input
						type="checkbox"
						role="switch"
						aria-label={t('channelPermission.preventEveryoneSendMessages')}
						checked={value}
						disabled={!canEdit}
						onChange={(event) => {
							if (canEdit) {
								setValue(event.target.checked);
								setSaveError(null);
							}
						}}
						data-e2e={generateE2eId('channel_setting_page.permissions.button.prevent_everyone_send_messages')}
						className="relative h-4 w-8 shrink-0 cursor-pointer appearance-none rounded-lg
							bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
							after:bg-slate-500 after:transition-all checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
							hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-[#4654C0] checked:after:hover:bg-white
							focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5265EC]
							disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</label>
				{value && (
					<div className="pt-8">
						<div className="flex justify-end pb-4">
							<button
								type="button"
								disabled={!canEdit}
								onClick={() => setShowModal(true)}
								className="px-4 py-1.5 rounded-lg btn-primary btn-primary-hover text-sm disabled:opacity-50 disabled:cursor-not-allowed"
								data-e2e={generateE2eId('channel_setting_page.permissions.exclusions.add')}
							>
								{t('channelPermission.addExcludeMembersRoles')}
							</button>
						</div>
						{(roleIds.length > 0 || userIds.length > 0) && (
							<div>
								<p className="pb-3 text-xs font-bold uppercase text-theme-primary">{t('channelPermission.allowExcludeSend')}</p>
								{roleIds.map((roleId) => {
									const role = roles.find((entry) => entry.id === roleId);
									const name = role?.title || roleId;
									return (
										<ExceptionRow
											key={roleId}
											id={roleId}
											kind="roles"
											disabled={!canEdit}
											removeLabel={t('channelPermission.removeException', { name })}
											onRemove={() => removeException('roles', roleId)}
										>
											{role?.role_icon ? (
												<img src={role.role_icon} alt="" className="size-5 rounded" />
											) : (
												<Icons.RoleIcon className="size-5 shrink-0" defaultFill1={role?.color || DEFAULT_ROLE_COLOR} />
											)}
											<span className="text-sm truncate">{name}</span>
										</ExceptionRow>
									);
								})}
								{userIds.map((userId) => {
									const staged = stagedProfiles[userId];
									const row = permissionMemberRow(
										userId,
										roster[userId],
										staged
											? {
													username: staged.username || '',
													displayName: staged.display_name || '',
													avatar: staged.avatar || ''
												}
											: profiles[userId]
									);
									return (
										<ExceptionRow
											key={userId}
											id={userId}
											kind="users"
											disabled={!canEdit}
											removeLabel={t('channelPermission.removeException', { name: row.name })}
											onRemove={() => removeException('users', userId)}
										>
											<AvatarImage
												alt={row.username}
												username={row.name}
												className="size-6 min-w-6"
												src={row.avatar}
												srcImgProxy={createImgproxyUrl(row.avatar)}
												classNameText="text-[9px]"
											/>
											<span className="text-sm truncate">{row.name}</span>
											{row.username && row.username !== row.name && (
												<span className="text-sm font-light truncate">{row.username}</span>
											)}
										</ExceptionRow>
									);
								})}
							</div>
						)}
					</div>
				)}
				{saveError && (
					<p role="alert" className="mt-2 text-xs text-theme-primary">
						{saveError}
					</p>
				)}
				{status === 'loading' && (
					<p role="status" className="mt-2 text-xs text-theme-primary">
						{t('channelPermission.loading')}
					</p>
				)}
				{status === 'error' && (
					<div className="mt-2 text-xs text-theme-primary" role="alert">
						<p>{t('channelPermission.loadPublicPermissionFailed')}</p>
						<button type="button" className="mt-1 underline" onClick={() => setReload((count) => count + 1)} disabled={busy}>
							{t('channelPermission.loadPermissions')}
						</button>
					</div>
				)}
			</div>
			{showModal && (
				<EveryoneExclusionsModal
					clanId={clanId}
					channelName={channelName}
					kind={kind}
					userIds={userIds}
					roleIds={roleIds}
					profiles={stagedProfiles}
					onCancel={() => setShowModal(false)}
					onDone={applySelection}
				/>
			)}
		</>
	);
};

export default PublicSendMessagePermission;
