import { useAuth, useEscapeKeyClose } from '@mezon/core';
import type { RolesClanEntity } from '@mezon/store';
import {
	channelUsersActions,
	selectAllRolesClan,
	selectAllUserClans,
	selectCurrentClanId,
	selectRolesByChannelId,
	selectUserChannelIds,
	useAppDispatch
} from '@mezon/store';
import { ButtonLoading, Icons, InputField } from '@mezon/ui';
import type { IChannel, UsersClanEntity } from '@mezon/utils';
import { ChannelStatusEnum, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import ListMembers from './listMembers';
import ListRole from './listRoles';
interface AddMemRoleProps {
	onClose: () => void;
	channel: IChannel;
	onSelectedUsersChange: (selectedUserIds: string[]) => void;
	onSelectedRolesChange: (selectedUserIds: string[]) => void;
	selectRoleIds: string[];
	selectUserIds: string[];
}
type filterItemProps = {
	listRolesNotAddChannel: RolesClanEntity[];
	listMembersNotInChannel: UsersClanEntity[];
};

export const AddMemRole: React.FC<AddMemRoleProps> = ({
	onClose,
	channel,
	onSelectedUsersChange,
	onSelectedRolesChange,
	selectUserIds,
	selectRoleIds
}) => {
	const { t } = useTranslation('channelSetting');
	const isPrivate = channel.channel_private;
	const rolesClan = useSelector(selectAllRolesClan);
	const currentClanId = useSelector(selectCurrentClanId);
	const rolesChannel = useSelector(selectRolesByChannelId(channel.id));
	const [selectedUserIds, setSelectedUserIds] = useState<string[]>(selectUserIds);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(selectRoleIds);
	const { userProfile } = useAuth();
	const rolesAddChannel = useMemo(
		() => rolesChannel.filter((role) => typeof role.role_channel_active === 'number' && role.role_channel_active === 1),
		[rolesChannel]
	);
	const listRolesNotAddChannel = useMemo(
		() =>
			rolesClan.filter(
				(role) =>
					!rolesAddChannel.map((roleAddChannel) => roleAddChannel.id).includes(role.id) &&
					role.creator_id !== '0' &&
					!selectedRoleIds.includes(role.id)
			),
		[rolesClan, rolesAddChannel, selectedRoleIds]
	);

	const usersClan = useSelector(selectAllUserClans);
	const userChannelIds = useSelector((state) => selectUserChannelIds(state, channel.channel_id || ''));
	const listUserInvite = useMemo(() => {
		if (channel.channel_private !== 1) {
			return usersClan.filter((user) => user.id !== userProfile?.user?.id && !selectedUserIds.includes(user.id));
		}
		const channelUserSet = new Set(userChannelIds);
		const selectedUserSet = new Set(selectedUserIds);

		return usersClan.filter((user) => !channelUserSet.has(user.id) && !selectedUserSet.has(user.id));
	}, [usersClan, userChannelIds, channel.channel_private, userProfile?.user?.id, selectedUserIds]);

	const initFilter: filterItemProps = useMemo(
		() => ({
			listMembersNotInChannel: listUserInvite,
			listRolesNotAddChannel
		}),
		[listRolesNotAddChannel, listUserInvite]
	);
	const [filterItem, setFilterItem] = useState<filterItemProps>(initFilter);

	const dispatch = useAppDispatch();
	const handleCheckboxUserChange = (event: React.ChangeEvent<HTMLInputElement>, userId: string) => {
		const isChecked = event.target.checked;
		if (isChecked) {
			setSelectedUserIds((prevIds) => [...prevIds, userId]);
		} else {
			setSelectedUserIds((prevIds) => prevIds.filter((id) => id !== userId));
		}
	};
	const handleCheckboxRoleChange = (event: React.ChangeEvent<HTMLInputElement>, roleId: string) => {
		const isChecked = event.target.checked;
		if (isChecked) {
			setSelectedRoleIds((prevIds) => [...prevIds, roleId]);
		} else {
			setSelectedRoleIds((prevIds) => prevIds.filter((id) => id !== roleId));
		}
	};

	const handleAddMember = async () => {
		onClose();
		if (channel.channel_private === 1) {
			if (selectedUserIds.length > 0) {
				const body = {
					channelId: channel.id,
					channelType: channel.type,
					userIds: selectedUserIds,
					clanId: currentClanId || ''
				};
				await dispatch(channelUsersActions.addChannelUsers(body));
			}
			if (selectedRoleIds.length > 0) {
				const body = {
					clanId: currentClanId || '',
					channelId: channel.id,
					roleIds: selectedRoleIds,
					channelType: channel.type
				};
				await dispatch(channelUsersActions.addChannelRoles(body));
			}
		} else {
			if (selectedUserIds.length > 0) {
				onSelectedUsersChange(selectedUserIds);
			}
			if (selectedRoleIds.length > 0) {
				onSelectedRolesChange(selectedRoleIds);
			}
		}
	};

	const [valueSearch, setValueSearch] = useState('');
	const handleValueSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValueSearch(e.target.value);
	};

	const filterData = useCallback(
		(input: string) => {
			const inputData = input.trim().toLowerCase();
			if (inputData.startsWith('@')) {
				const searchValue = inputData.substring(1);
				const filteredMembers = listUserInvite.filter((member) => {
					const user = member.user;
					const clanName = member?.clan_nick?.toLowerCase();
					const displayName = user?.display_name?.toLowerCase();
					const username = user?.username?.toLowerCase();
					return (
						(clanName?.includes(searchValue) || displayName?.includes(searchValue) || username?.includes(searchValue)) &&
						!selectedUserIds.includes(member?.id || '')
					);
				});
				setFilterItem({
					listMembersNotInChannel: filteredMembers,
					listRolesNotAddChannel: []
				});
				return;
			}
			const filteredMembers = listUserInvite.filter((member) => {
				const user = member.user;
				const clanName = member?.clan_nick?.toLowerCase();
				const displayName = user?.display_name?.toLowerCase();
				const username = user?.username?.toLowerCase();
				return (
					(clanName?.includes(inputData) || displayName?.includes(inputData) || username?.includes(inputData)) &&
					!selectedUserIds.includes(member?.id || '')
				);
			});
			const filteredRoles = listRolesNotAddChannel.filter(
				(item) =>
					item?.title?.toLowerCase().trim().includes(inputData.toLowerCase().trim()) &&
					item?.creator_id !== '0' &&
					!selectedRoleIds.includes(item.id)
			);
			setFilterItem({
				listMembersNotInChannel: filteredMembers,
				listRolesNotAddChannel: filteredRoles
			});
		},
		[listRolesNotAddChannel, listUserInvite, selectedUserIds, selectedRoleIds]
	);

	const debouncedSetValueSearch = useDebouncedCallback((value) => {
		filterData(value);
	}, 300);

	useEffect(() => {
		debouncedSetValueSearch(valueSearch);
	}, [valueSearch, debouncedSetValueSearch]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	return (
		<div ref={modalRef} tabIndex={-1} className="fixed  inset-0 flex items-center justify-center z-50 ">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<div
				className="relative z-10 p-6 bg-theme-setting-primary text-theme-primary rounded-[5px] w-[440px] text-[15px]"
				data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal')}
			>
				<h2 className="text-[24px] font-semibold text-center text-theme-primary-active">{t('addMembersRoles.title')}</h2>
				<div className="flex justify-center">
					{isPrivate === ChannelStatusEnum.isPrivate && channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && (
						<Icons.SpeakerLocked defaultSize="w-5 h-5" />
					)}
					{isPrivate === ChannelStatusEnum.isPrivate && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && (
						<Icons.HashtagLocked defaultSize="w-5 h-5 " />
					)}
					{isPrivate === undefined && channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && <Icons.Speaker defaultSize="w-5 5-5" />}
					{isPrivate === undefined && channel.type === ChannelType.CHANNEL_TYPE_STREAMING && <Icons.Stream defaultSize="w-5 5-5" />}
					{isPrivate === undefined && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && <Icons.Hashtag defaultSize="w-5 h-5" />}
					<p className=" text-[16px] break-words">{channel.channel_label}</p>
				</div>
				<div className="py-3">
					<InputField
						type="text"
						placeholder={t('addMembersRoles.placeholder')}
						className="pl-3 py-[6px] w-full text-theme-message rounded-lg outline-none bg-input-secondary"
						onChange={handleValueSearch}
						maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
					/>
					<p className="text-xs pt-2">{t('addMembersRoles.instruction')}</p>
				</div>
				<div className="max-h-[270px] min-h-[270px] overflow-y-scroll hide-scrollbar">
					{filterItem.listRolesNotAddChannel.length !== 0 && (
						<div>
							<p className="uppercase font-bold text-xs pb-4">{t('addMembersRoles.roles')}</p>
							<div data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal.role_list')}>
								<ListRole
									listItem={filterItem.listRolesNotAddChannel}
									selectedRoleIds={selectedRoleIds}
									handleCheckboxRoleChange={handleCheckboxRoleChange}
								/>
							</div>
						</div>
					)}
					{userChannelIds.length !== 0 && (
						<div className="mt-2">
							<p className="uppercase font-bold text-xs pb-4">{t('addMembersRoles.members')}</p>
							<div data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal.member_list')}>
								<ListMembers
									listItem={filterItem.listMembersNotInChannel}
									selectedUserIds={selectedUserIds}
									handleCheckboxUserChange={handleCheckboxUserChange}
								/>
							</div>
						</div>
					)}
				</div>

				<div className="flex justify-center mt-10 text-[14px]">
					<button
						color="gray"
						onClick={onClose}
						className="px-4 py-2 mr-5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring focus:border-blue-300"
					>
						{t('addMembersRoles.cancel')}
					</button>
					<ButtonLoading
						label={t('addMembersRoles.done')}
						onClick={handleAddMember}
						className="px-4 py-2 rounded-lg btn-primary btn-primary-hover"
					/>
				</div>
			</div>
		</div>
	);
};
