import { useRoles } from '@mezon/core';
import type { RolesClanEntity } from '@mezon/store';
import {
	getSelectedRoleId,
	selectAllUserClans,
	selectCurrentClanId,
	selectCurrentRoleIcon,
	selectTheme,
	setAddMemberRoles,
	usersClanActions
} from '@mezon/store';
import { ButtonLoading, Icons, InputField } from '@mezon/ui';
import { ThemeApp, createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
interface ModalProps {
	isOpen: boolean;
	RolesClan: RolesClanEntity[];
	onClose: () => void;
}

export const AddMembersModal: React.FC<ModalProps> = ({ isOpen, RolesClan, onClose }) => {
	const { t } = useTranslation('clanRoles');
	const dispatch = useDispatch();
	const appearanceTheme = useSelector(selectTheme);
	const currentClanId = useSelector(selectCurrentClanId);
	const usersClan = useSelector(selectAllUserClans);
	const selectedRoleId = useSelector(getSelectedRoleId);
	const currentRoleIcon = useSelector(selectCurrentRoleIcon);

	const { updateRole } = useRoles();

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedUserIds, setSelectedUserIds] = useState<Record<string, boolean>>({});

	const selectedRole = useMemo(() => {
		return RolesClan.find((role) => role.id === selectedRoleId);
	}, [RolesClan, selectedRoleId]);

	const userIdsInSelectedRole = useMemo(() => {
		return selectedRole?.role_user_list?.role_users?.reduce<Record<string, boolean>>((ids, user) => {
			if (user.id) {
				ids[user.id] = true;
			}
			return ids;
		}, {});
	}, [selectedRole]);

	const usersNotInSelectedRole = useMemo(() => {
		if (!userIdsInSelectedRole) {
			return [...usersClan];
		}
		return usersClan.filter((user) => !userIdsInSelectedRole[user.id]);
	}, [userIdsInSelectedRole]);

	const displayUsers = useMemo(() => {
		const lowerCaseSearchTerm = searchTerm.toLowerCase();
		return usersNotInSelectedRole.filter((user) => {
			const clanName = user?.clan_nick?.toLowerCase();
			const displayName = user.user?.display_name?.toLowerCase();
			const username = user.user?.username?.toLowerCase();
			return clanName?.includes(lowerCaseSearchTerm) || displayName?.includes(lowerCaseSearchTerm) || username?.includes(lowerCaseSearchTerm);
		});
	}, [searchTerm, usersNotInSelectedRole]);

	const handleUserToggle = useCallback((id: string, checked: boolean) => {
		setSelectedUserIds((userIds) => {
			const temp = { ...userIds };
			if (checked) {
				return { ...temp, [id]: checked };
			}
			delete temp[id];
			return temp;
		});
	}, []);

	const handleUpdateRole = useCallback(async () => {
		const userIds = Object.keys(selectedUserIds);

		if (selectedRoleId === t('roleManagement.newRoleDefault')) {
			dispatch(setAddMemberRoles(userIds));
		} else {
			await updateRole(
				currentClanId ?? '',
				selectedRoleId,
				selectedRole?.title ?? '',
				selectedRole?.color ?? '',
				userIds,
				[],
				[],
				[],
				currentRoleIcon
			);
		}
		dispatch(
			usersClanActions.updateManyRoleIds({
				clanId: currentClanId as string,
				updates: userIds.map((id) => ({ userId: id, roleId: selectedRoleId, clanId: currentClanId }))
			})
		);
		onClose();
	}, [selectedRoleId, currentClanId, selectedRole, selectedUserIds]);

	useEffect(() => {
		if (!isOpen) {
			setSelectedUserIds({});
		}
	}, [isOpen]);

	return (
		isOpen && (
			<div
				className={`fixed  inset-0 flex items-center justify-center z-50 ${appearanceTheme === ThemeApp.Light && 'lightModeScrollBarMention'}`}
			>
				<div className="fixed inset-0 bg-black opacity-80"></div>
				<div className=" bg-theme-setting-primary text-theme-primary relative z-10 p-6 rounded-[5px] text-center w-[440px] flex flex-col justify-between gap-y-2">
					<div>
						<h2 className="text-2xl font-semibold text-theme-primary-active">{t('setupMember.addMember')}</h2>
						<p className=" text-[16px] mb-4 font-light inline-flex gap-x-2 items-center">
							<Icons.RoleIcon defaultSize="w-5 h-[30px] min-w-5" />
							{selectedRole?.title}
						</p>
						<div className="w-full flex mb-3">
							<InputField
								className="flex-grow rounded w-full p-2 focus:outline-none  text-base"
								type="text"
								placeholder={t('setupMember.searchMembers')}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
						<p className="text-xs font-bold uppercase mb-2 text-left">{t('members')}</p>
						<div className="overflow-y-auto thread-scroll">
							<ul className="flex flex-col gap-y-[5px] max-h-[200px] font-light text-sm ">
								{displayUsers.map((user) => (
									<ItemMemberModal
										key={user?.id}
										id={user?.id}
										username={user?.user?.username}
										displayName={user?.user?.display_name}
										clanName={user?.clan_nick}
										clanAvatar={user.clan_avatar}
										avatar={user?.user?.avatar_url}
										checked={Boolean(selectedUserIds[user.id])}
										onHandle={(checked: boolean) => handleUserToggle(user.id, checked)}
									/>
								))}
							</ul>
						</div>
					</div>
					<div className="flex justify-center text-[14px] gap-x-7">
						<button color="gray" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 ">
							{t('roleDetail.doNotSave')}
						</button>
						<ButtonLoading
							label={t('setupMember.add')}
							className="px-4 py-2 btn-primary-hover btn-primary  rounded-lg "
							onClick={handleUpdateRole}
						/>
					</div>
				</div>
			</div>
		)
	);
};

type ItemMemberModalProps = {
	id?: string;
	username?: string;
	displayName?: string;
	clanName?: string;
	clanAvatar?: string;
	avatar?: string;
	checked: boolean;
	onHandle: (value: boolean) => void;
};

const ItemMemberModal = (props: ItemMemberModalProps) => {
	const { id = '', username = '', displayName = '', clanName = '', clanAvatar = '', avatar = '', checked = false, onHandle } = props;
	const namePrioritize = getNameForPrioritize(clanName, displayName, username);
	const avatarPrioritize = getAvatarForPrioritize(clanAvatar, avatar);
	return (
		<li key={id}>
			<label htmlFor={id} className="w-full inline-flex justify-between items-center">
				<div className="inline-flex gap-x-2">
					<AvatarImage
						alt={username}
						username={username}
						className="min-w-5 min-h-5 max-w-5 max-h-5"
						srcImgProxy={createImgproxyUrl(avatarPrioritize ?? '')}
						src={avatarPrioritize}
						classNameText="text-[9px] pt-[3px]"
					/>
					<p className="font-semibold one-line">{namePrioritize}</p>
					<p className="text-contentTertiary one-line">{username}</p>
				</div>
				<input id={id} type="checkbox" checked={checked} onChange={(event) => onHandle(event.target.checked)} />
			</label>
		</li>
	);
};
