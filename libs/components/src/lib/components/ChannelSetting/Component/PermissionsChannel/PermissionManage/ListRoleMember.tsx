import type { RolesClanEntity } from '@mezon/store';
import {
	channelUsersActions,
	permissionRoleChannelActions,
	selectChannelById,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { UsersClanEntity } from '@mezon/utils';
import { createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize, searchNormalizeText } from '@mezon/utils';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../../../AvatarImage/AvatarImage';

type combinedArray = {
	id: string;
	title: string | undefined;
	type: number;
}[];

type ListRoleMemberProps = {
	listManageNotInChannel: RolesClanEntity[];
	listManageInChannel: combinedArray;
	usersClan: UsersClanEntity[];
	setListManage?: React.Dispatch<React.SetStateAction<RolesClanEntity[]>>;
	channelId: string;
	onSelect: (id: string, type: number) => void;
	canChange: boolean;
};

const ListRoleMember = memo((props: ListRoleMemberProps) => {
	const { listManageInChannel, usersClan, channelId, onSelect, canChange, listManageNotInChannel } = props;
	const [selectedItemId, setSelectedItemId] = useState<string | null>(listManageInChannel[0].id);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (listManageInChannel.length > 0) {
			onSelect(listManageInChannel[0].id, listManageInChannel[0].type);
			if (listManageInChannel[0].type === 0) {
				dispatch(
					permissionRoleChannelActions.fetchPermissionRoleChannel({
						channelId,
						roleId: listManageInChannel[0].id,
						userId: ''
					})
				);
			} else {
				dispatch(
					permissionRoleChannelActions.fetchPermissionRoleChannel({
						channelId,
						roleId: '',
						userId: listManageInChannel[0].id
					})
				);
			}
		}
	}, [channelId]);

	const handleItemClick = (item: any) => {
		if (canChange) {
			setSelectedItemId(item.id);
			onSelect(item.id, item.type);
			if (item.type === 0) {
				dispatch(permissionRoleChannelActions.fetchPermissionRoleChannel({ channelId, roleId: item.id, userId: '', noCache: true }));
			} else {
				dispatch(permissionRoleChannelActions.fetchPermissionRoleChannel({ channelId, roleId: '', userId: item.id, noCache: true }));
			}
		}
	};

	return (
		<div className="basis-1/3">
			<HeaderAddRoleMember listManageNotInChannel={listManageNotInChannel} usersClan={usersClan} channelId={channelId} />
			<div className="mt-2">
				{listManageInChannel.map((item) => (
					<div
						key={item.id}
						onClick={() => handleItemClick(item)}
						className={`w-full py-1.5 px-[10px] text-[15px] text-theme-primary bg-item-hover font-medium inline-flex gap-x-2 items-center rounded ${
							selectedItemId === item.id ? 'bg-item-theme' : ''
						}`}
					>
						{item.title}
					</div>
				))}
			</div>
		</div>
	);
});

export default ListRoleMember;

type HeaderAddRoleMemberProps = {
	listManageNotInChannel: RolesClanEntity[];
	usersClan: UsersClanEntity[];
	channelId: string;
};

const HeaderAddRoleMember = memo((props: HeaderAddRoleMemberProps) => {
	const { listManageNotInChannel, usersClan, channelId } = props;
	const { t } = useTranslation('channelSetting');
	const [showPopup, setShowPopup] = useState(false);

	const channel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	const panelRef = useRef<HTMLDivElement | null>(null);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const addRole = async (roleId: string) => {
		const body = {
			clanId: currentClanId || '',
			channelId: channel.id,
			roleIds: [roleId],
			channelType: channel.type
		};
		await dispatch(channelUsersActions.addChannelRoles(body));
	};

	const addUser = async (userId: string) => {
		const body = {
			channelId: channel.id,
			channelType: channel.type,
			userIds: [userId],
			clanId: currentClanId || ''
		};
		await dispatch(channelUsersActions.addChannelUsers(body));
	};

	const [search, setSearch] = useState('');

	const listRoleCanAdd = useMemo(() => {
		if (!search) {
			return listManageNotInChannel;
		}
		return listManageNotInChannel.filter((role) => searchNormalizeText(role.title, search));
	}, [search]);

	const listMemberCanAdd = useMemo(() => {
		if (!search) {
			return usersClan;
		}
		return usersClan.filter(
			(user) =>
				searchNormalizeText(user?.clan_nick || '', search) ||
				searchNormalizeText(user.user?.display_name || '', search) ||
				searchNormalizeText(user.user?.username || '', search)
		);
	}, [search]);

	return (
		<div ref={panelRef} className="flex justify-between items-center relative" onClick={() => setShowPopup(!showPopup)}>
			<h4 className="uppercase font-bold text-xs text-theme-primary-active">{t('channelPermission.bottomSheet.rolesMembers')}</h4>
			{channel?.channel_private === 1 && <Icons.PlusIcon defaultSize="size-4  cursor-pointer" />}
			{showPopup && (
				<div
					className="absolute bottom-5 w-64 rounded-lg overflow-hidden bg-theme-setting-primary border-theme-primary"
					onClick={(e) => e.stopPropagation()}
				>
					<div className=" flex gap-x-1 p-4 text-sm bg-theme-setting-nav">
						<p className="font-bold text-theme-primary-active">{t('channelPermission.bottomSheet.add')}:</p>
						<input
							type="text"
							className="bg-transparent outline-none font-medium"
							placeholder={t('channelPermission.bottomSheet.roleMemberPlaceholder')}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div
						className=" p-2 h-64 overflow-y-scroll hide-scrollbar text-theme-primary text-theme-primary-hover"
						onClick={() => setShowPopup(!showPopup)}
					>
						{Boolean(listRoleCanAdd.length) && (
							<div>
								<p className="px-3 py-2 uppercase text-[11px] font-bold">{t('channelPermission.bottomSheet.roles')}</p>
								{listRoleCanAdd.map((item) => (
									<div key={item.id} className="rounded px-3 py-2 font-semibold bg-item-hover" onClick={() => addRole(item.id)}>
										{item.title}
									</div>
								))}
							</div>
						)}
						{Boolean(listMemberCanAdd.length) && (
							<div>
								<p className="px-3 py-2 uppercase text-[11px] font-bold">{t('channelPermission.bottomSheet.members')}</p>
								{listMemberCanAdd.map((item) => (
									<div key={item.id} onClick={() => addUser(item.id)}>
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
