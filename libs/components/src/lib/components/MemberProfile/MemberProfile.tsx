import { useColorsRoleById } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import { selectCurrentChannelId, selectCurrentDM } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { UsersClanEntity } from '@mezon/utils';
import { EUserStatus, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../components';
import { UserStatusIconClan } from './IconStatus';

type BaseMemberProfileProps = {
	id: string;
	userMeta?: { status?: EUserStatus; online: boolean };
	user: ChannelMembersEntity | UsersClanEntity;
	username: string;
	avatar: string;
	isOwner?: boolean;
	userStatus?: ReactNode;
	onContextMenu: (event: React.MouseEvent<Element, MouseEvent>, channelId: string, user: UsersClanEntity) => void;
	onClick: (event: React.MouseEvent) => void;
};

export const BaseMemberProfile = ({ id, user, userMeta, username, avatar, isOwner, userStatus, onContextMenu, onClick }: BaseMemberProfileProps) => {
	const currentChannelID = useSelector(selectCurrentChannelId);
	const currentDmGroup = useSelector(selectCurrentDM);
	const handleContextMenu = (event: React.MouseEvent) => {
		const userTemplate: UsersClanEntity = {
			...user,
			id,
			prioritizeName: username,
			clan_avatar: avatar,
			user: {
				...user?.user,
				username: user?.user?.username,
				display_name: user?.user?.display_name,
				avatar_url: user?.user?.avatar_url
			}
		};
		onContextMenu(event, currentDmGroup?.channel_id || '', userTemplate);
	};

	const isOffline = userMeta?.status === EUserStatus.INVISIBLE || !userMeta?.online;

	return (
		<div className={`relative group w-full ${isOffline ? 'opacity-50' : ''}`}>
			<div
				onContextMenu={handleContextMenu}
				onClick={onClick}
				className="cursor-pointer flex items-center gap-[9px] relative"
				data-e2e={generateE2eId('clan_page.secondary_side_bar.member')}
			>
				<div className="relative">
					<AvatarImage
						alt={username}
						username={user?.user?.username ?? username}
						className="min-w-8 min-h-8 max-w-8 max-h-8"
						classNameText="font-semibold"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
					/>
					<div className="rounded-full right-[-4px] absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-theme-primary">
						<UserStatusIconClan channelId={currentChannelID || currentDmGroup.id || ''} userId={user.id} status={userMeta?.status} />
					</div>
				</div>

				<div className="flex flex-col font-medium">
					<ClanUserName userId={user?.id} name={username} isOwner={!!isOwner} />
					<p className="text-xs text-left text-theme-primary opacity-60 line-clamp-1 truncate overflow-hidden flex-nowrap max-w-[100px] ">
						{userStatus}
					</p>
				</div>
			</div>
		</div>
	);
};

export function ClanUserName({ name, userId, isOwner }: { name: string; userId: string; isOwner: boolean }) {
	const userRolesClan = useColorsRoleById(userId || '');

	return (
		<div className="flex text-start gap-1">
			<span
				style={{ color: userRolesClan.highestPermissionRoleColor }}
				className="one-line text-start "
				data-e2e={generateE2eId(`chat.direct_message.chat_item.username`, userId)}
			>
				{name}
			</span>

			{isOwner && (
				<button className="w-[14px] text-center h-[14px] pt-[4px]">
					<Icons.OwnerIcon />
				</button>
			)}
		</div>
	);
}
