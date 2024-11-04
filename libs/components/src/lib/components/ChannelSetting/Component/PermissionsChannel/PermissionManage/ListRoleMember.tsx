import {
	channelUsersActions,
	permissionRoleChannelActions,
	RolesClanEntity,
	selectChannelById,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector,
	UsersClanEntity
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { memo, useEffect, useRef, useState } from 'react';
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
						channelId: channelId,
						roleId: listManageInChannel[0].id,
						userId: ''
					})
				);
			} else {
				dispatch(
					permissionRoleChannelActions.fetchPermissionRoleChannel({
						channelId: channelId,
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
				dispatch(
					permissionRoleChannelActions.fetchPermissionRoleChannel({ channelId: channelId, roleId: item.id, userId: '', noCache: true })
				);
			} else {
				dispatch(
					permissionRoleChannelActions.fetchPermissionRoleChannel({ channelId: channelId, roleId: '', userId: item.id, noCache: true })
				);
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
						className={`w-full py-1.5 px-[10px] text-[15px] bg-transparent hover:bg-bgLightModeButton font-medium inline-flex gap-x-2 items-center rounded ${
							selectedItemId === item.id
								? 'dark:bg-bgModifierHover bg-bgLightModeButton'
								: 'dark:text-textDarkTheme text-textLightTheme'
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
	return (
		<div ref={panelRef} className="flex justify-between items-center relative" onClick={() => setShowPopup(!showPopup)}>
			<h4 className="uppercase font-bold text-xs text-contentTertiary">Roles/Members</h4>
			{channel?.channel_private === 1 && <Icons.PlusIcon defaultSize="size-4 text-contentTertiary cursor-pointer" />}
			{showPopup && (
				<div className="absolute bottom-5 w-64 rounded-lg overflow-hidden dark:text-contentTertiary text-colorTextLightMode border dark:border-gray-700 border-gray-300">
					<div className="dark:bg-bgTertiary bg-bgLightModeSecond flex gap-x-1 p-4 text-sm">
						<p className="font-bold">ADD:</p>
						<input type="text" className="bg-transparent outline-none font-medium" placeholder="Role/Member" />
					</div>
					<div className="dark:bg-bgSecondary bg-white p-2 h-64 overflow-y-scroll hide-scrollbar">
						{Boolean(listManageNotInChannel.length) && (
							<div>
								<p className="px-3 py-2 uppercase text-[11px] font-bold">Role</p>
								{listManageNotInChannel.map((item) => (
									<div
										key={item.id}
										className="rounded px-3 py-2 font-semibold dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton dark:hover:text-white hover:text-black"
										onClick={() => addRole(item.id)}
									>
										{item.title}
									</div>
								))}
							</div>
						)}
						{Boolean(usersClan.length) && (
							<div>
								<p className="px-3 py-2 uppercase text-[11px] font-bold">Member</p>
								{usersClan.map((item) => (
									<div key={item.id} onClick={() => addUser(item.id)}>
										<ItemUser
											userName={item.user?.username}
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
	userName?: string;
	displayName?: string;
	clanName?: string;
	avatar?: string;
	avatarClan?: string;
};

const ItemUser = (props: ItemUserProps) => {
	const { userName = '', displayName = '', clanName = '', avatar = '', avatarClan = '' } = props;
	const namePrioritize = getNameForPrioritize(clanName, displayName, userName);
	const avatarPrioritize = getAvatarForPrioritize(avatarClan, avatar);
	return (
		<div className="rounded px-3 py-2 font-semibold dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton dark:hover:text-white hover:text-black flex items-center gap-x-2">
			<AvatarImage alt={userName} userName={userName} className="min-w-8 min-h-8 max-w-8 max-h-8" src={avatarPrioritize} />
			<p className="font-medium">{namePrioritize}</p>
		</div>
	);
};
