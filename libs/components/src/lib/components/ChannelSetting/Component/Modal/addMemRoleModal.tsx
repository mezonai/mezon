import { useAuth, useEscapeKeyClose } from '@mezon/core';
import {
	RolesClanEntity,
	channelUsersActions,
	selectAllRolesClan,
	selectAllUserChannel,
	selectAllUserClans,
	selectCurrentClanId,
	selectRolesByChannelId,
	useAppDispatch
} from '@mezon/store';
import { Icons, InputField } from '@mezon/ui';
import { ChannelStatusEnum, IChannel } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { ApiUser } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
	listMembersNotInChannel: (ApiUser | undefined)[];
};

export const AddMemRole: React.FC<AddMemRoleProps> = ({
	onClose,
	channel,
	onSelectedUsersChange,
	onSelectedRolesChange,
	selectUserIds,
	selectRoleIds
}) => {
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
		() => rolesClan.filter((role) => !rolesAddChannel.map((roleAddChannel) => roleAddChannel.id).includes(role.id) && role.creator_id !== '0'),
		[rolesClan, rolesAddChannel]
	);

	const usersClan = useSelector(selectAllUserClans);
	const rawMembers = useSelector(selectAllUserChannel(channel.channel_id || ''));
	const listUserInvite = useMemo(() => {
		if (channel.channel_private !== 1) {
			return usersClan.filter((user) => user.id !== userProfile?.user?.id);
		}
		const memberIds = rawMembers.map((member) => member.user?.id || '');
		return usersClan.filter((user) => !memberIds.some((userId) => userId === user.id));
	}, [usersClan, rawMembers, channel.channel_private, userProfile?.user?.id]);

	const listMembersNotInChannel = useMemo(
		() =>
			listUserInvite
				? listUserInvite.map((member: any) => ({ ...member?.user, clanNick: member?.clan_nick, clanAvatar: member?.clan_avatar }))
				: [],
		[listUserInvite]
	);

	const initFilter: filterItemProps = useMemo(
		() => ({
			listMembersNotInChannel: listMembersNotInChannel,
			listRolesNotAddChannel: listRolesNotAddChannel
		}),
		[listRolesNotAddChannel, listMembersNotInChannel]
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
				const filteredMembers = listMembersNotInChannel.filter((member) => {
					const clanName = member?.clanNick?.toLowerCase();
					const displayName = member?.display_name?.toLowerCase();
					const username = member?.username?.toLowerCase();
					return clanName?.includes(searchValue) || displayName?.includes(searchValue) || username?.includes(searchValue);
				});
				setFilterItem({
					listMembersNotInChannel: filteredMembers,
					listRolesNotAddChannel: []
				});
				return;
			}
			const filteredMembers = listMembersNotInChannel.filter((member) => {
				const clanName = member?.clanNick?.toLowerCase();
				const displayName = member?.display_name?.toLowerCase();
				const username = member?.username?.toLowerCase();
				return clanName?.includes(inputData) || displayName?.includes(inputData) || username?.includes(inputData);
			});
			const filteredRoles = listRolesNotAddChannel.filter(
				(item) => item?.title?.toLowerCase().trim().includes(inputData.toLowerCase().trim()) && item?.creator_id !== '0'
			);
			setFilterItem({
				listMembersNotInChannel: filteredMembers,
				listRolesNotAddChannel: filteredRoles
			});
		},
		[listRolesNotAddChannel, listMembersNotInChannel]
	);

	const debouncedSetValueSearch = useDebouncedCallback((value) => {
		filterData(value);
	}, 300);

	useEffect(() => {
		debouncedSetValueSearch(valueSearch);
	}, [valueSearch]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	return (
		<div ref={modalRef} tabIndex={-1} className="fixed  inset-0 flex items-center justify-center z-50 text-white">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<div className="relative z-10 dark:bg-bgDisable bg-bgLightMode dark:text-textDarkTheme text-textLightTheme p-6 rounded-[5px] w-[440px] text-[15px]">
				<h2 className="text-[24px] font-semibold text-center">Add members or roles</h2>
				<div className="flex justify-center">
					{isPrivate === ChannelStatusEnum.isPrivate &&
						(channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) && (
							<Icons.SpeakerLocked defaultSize="w-5 h-5" />
						)}
					{isPrivate === ChannelStatusEnum.isPrivate && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && (
						<Icons.HashtagLocked defaultSize="w-5 h-5 " />
					)}
					{isPrivate === undefined &&
						(channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) && (
							<Icons.Speaker defaultSize="w-5 5-5" />
						)}
					{isPrivate === undefined && channel.type === ChannelType.CHANNEL_TYPE_STREAMING && <Icons.Stream defaultSize="w-5 5-5" />}
					{isPrivate === undefined && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL && <Icons.Hashtag defaultSize="w-5 h-5" />}
					<p className="dark:text-[#AEAEAE] text-colorTextLightMode text-[16px]" style={{ wordBreak: 'break-word' }}>
						{channel.channel_label}
					</p>
				</div>
				<div className="py-3">
					<InputField
						type="text"
						placeholder="e.g. Moderators, @wumpus"
						className="dark:bg-bgTertiary bg-bgLightTertiary pl-3 py-[6px] w-full border-0 outline-none rounded"
						onChange={handleValueSearch}
						maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
					/>
					<p className="text-xs pt-2">Add individual members by starting with @ or type a role name</p>
				</div>
				<div className="max-h-[270px] min-h-[270px] overflow-y-scroll hide-scrollbar">
					{filterItem.listRolesNotAddChannel.length !== 0 && (
						<div>
							<p className="uppercase font-bold text-xs pb-4">Roles</p>
							<div>
								<ListRole
									listItem={filterItem.listRolesNotAddChannel}
									selectedRoleIds={selectedRoleIds}
									handleCheckboxRoleChange={handleCheckboxRoleChange}
								/>
							</div>
						</div>
					)}
					{filterItem.listMembersNotInChannel.length !== 0 && (
						<div className="mt-2">
							<p className="uppercase font-bold text-xs pb-4">Members</p>
							<div>
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
						className="px-4 py-2 mr-5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring focus:border-blue-300"
					>
						Cancel
					</button>
					<button
						color="blue"
						onClick={handleAddMember}
						className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-500 focus:outline-none focus:ring focus:border-blue-300"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
};
