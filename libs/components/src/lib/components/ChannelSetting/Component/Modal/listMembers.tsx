import { Icons } from '@mezon/ui';
import type { UsersClanEntity } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';

type ListMembersProps = {
	listItem: UsersClanEntity[];
	selectedUserIds: string[];
	handleCheckboxUserChange: (event: React.ChangeEvent<HTMLInputElement>, userId: string) => void;
};

const ListMembers = (props: ListMembersProps) => {
	const { listItem, selectedUserIds, handleCheckboxUserChange } = props;
	return listItem.map((user: UsersClanEntity) => (
		<ItemMember
			key={user?.id}
			username={user?.user?.username}
			displayName={user?.user?.display_name}
			clanAvatar={user.clan_avatar}
			avatar={user?.clan_avatar || user.user?.avatar_url}
			clanName={user.clan_nick}
			checked={selectedUserIds.includes(user?.id || '')}
			onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleCheckboxUserChange(event, user?.id || '')}
		/>
	));
};

export default ListMembers;

type ItemMemberProps = {
	username?: string;
	displayName?: string;
	clanName?: string;
	clanAvatar?: string;
	avatar?: string;
	checked: boolean;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ItemMember = (props: ItemMemberProps) => {
	const { username = '', displayName = '', clanName = '', clanAvatar = '', avatar = '', checked, onChange } = props;
	const namePrioritize = getNameForPrioritize(clanName, displayName, username);
	const avatarPrioritize = getAvatarForPrioritize(clanAvatar, avatar);
	return (
		<div
			className={`flex justify-between py-2 rounded bg-item-hover px-[6px]`}
			data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item')}
		>
			<label className="flex gap-x-2 items-center w-full">
				<div className="relative flex flex-row justify-center">
					<input
						type="checkbox"
						value={displayName}
						checked={checked}
						onChange={onChange}
						className="peer appearance-none forced-colors:appearance-auto relative w-4 h-4  border-theme-primary rounded-lg focus:outline-none"
						data-e2e={generateE2eId(
							'channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item.input'
						)}
					/>
					<Icons.Check className="absolute invisible peer-checked:visible forced-colors:hidden w-4 h-4" />
				</div>
				<AvatarImage
					alt={username}
					username={username}
					className="min-w-6 min-h-6 max-w-6 max-h-6"
					srcImgProxy={createImgproxyUrl(avatarPrioritize ?? '')}
					src={avatarPrioritize}
					classNameText="text-[9px] pt-[3px]"
				/>
				<p
					className="text-sm one-line text-theme-primary-active"
					data-e2e={generateE2eId(
						'channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item.name_prioritize'
					)}
				>
					{namePrioritize}
				</p>
				<p
					className=" font-light"
					data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal.member_list.member_item.username')}
				>
					{username}
				</p>
			</label>
		</div>
	);
};
