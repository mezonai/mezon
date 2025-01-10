import { useShowName } from '@mezon/core';
import { RolesClanEntity, selectMemberClanByUserId2, selectRolesClanEntities, useAppSelector } from '@mezon/store';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, DEFAULT_ROLE_COLOR, IMessageWithUser, convertTimeString } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import usePendingNames from './usePendingNames';

type IMessageHeadProps = {
	message: IMessageWithUser;
	mode?: number;
	onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
};

const MessageHead = ({ message, mode, onClick }: IMessageHeadProps) => {
	const messageTime = convertTimeString(message?.create_time as string);
	const userClan = useAppSelector((state) => selectMemberClanByUserId2(state, message?.sender_id));
	const usernameSender = userClan?.user?.username;
	const clanNick = userClan?.clan_nick;
	const displayName = userClan?.user?.display_name;
	const rolesClanEntity = useSelector(selectRolesClanEntities);
	const userRolesClan = useMemo(() => {
		const activeRole: Array<RolesClanEntity> = [];
		let highestPermissionRole = null;
		let maxLevelPermission = 0;
		for (const key in rolesClanEntity) {
			const role = rolesClanEntity[key];
			const checkHasRole = role.role_user_list?.role_users?.some((listUser) => listUser.id === message?.sender_id);
			if (checkHasRole) {
				activeRole.push(role);
				if (role.max_level_permission !== undefined && role.max_level_permission > maxLevelPermission) {
					maxLevelPermission = role.max_level_permission;
					highestPermissionRole = role;
				}
			}
		}
		return {
			highestPermissionRoleColor: highestPermissionRole?.color || activeRole[0]?.color || DEFAULT_ROLE_COLOR
		};
	}, [message?.sender_id, rolesClanEntity]);

	const { pendingClannick, pendingDisplayName, pendingUserName } = usePendingNames(
		message,
		clanNick ?? '',
		displayName ?? '',
		usernameSender ?? '',
		message.clan_nick ?? '',
		message?.display_name ?? '',
		message?.username ?? ''
	);

	const nameShowed = useShowName(
		clanNick ? clanNick : (pendingClannick ?? ''),
		displayName ? displayName : (pendingDisplayName ?? ''),
		usernameSender ? usernameSender : (pendingUserName ?? ''),
		message?.sender_id ?? ''
	);

	return (
		<div className="relative group">
			<div className="flex-row items-center w-full gap-4 flex">
				<div
					className="text-base font-medium tracking-normal cursor-pointer break-all username hover:underline"
					onClick={onClick}
					role="button"
					style={{
						letterSpacing: '-0.01rem',
						color:
							mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
								? userRolesClan.highestPermissionRoleColor
								: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR
					}}
				>
					{mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
						? nameShowed
						: message?.display_name
							? message?.display_name
							: message?.username}
				</div>
				<div className=" dark:text-zinc-400 text-colorTextLightMode text-[10px] cursor-default">{messageTime}</div>
			</div>
		</div>
	);
};

export default memo(MessageHead, (prev, cur) => prev.message?.id === cur.message?.id && prev.message?.sender_id === cur.message?.sender_id);
