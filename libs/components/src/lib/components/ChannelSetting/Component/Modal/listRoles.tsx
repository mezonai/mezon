import type { RolesClanEntity } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';

type ListRoleProps = {
	listItem: RolesClanEntity[];
	selectedRoleIds: string[];
	handleCheckboxRoleChange: (event: React.ChangeEvent<HTMLInputElement>, roleId: string) => void;
};

const ListRole = (props: ListRoleProps) => {
	const { listItem, selectedRoleIds, handleCheckboxRoleChange } = props;
	return listItem.map((role, index) => (
		<div
			className={'flex justify-between py-2 bg-item-hover px-[6px] rounded'}
			key={role.id}
			data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal.role_list.role_item')}
		>
			<label className="flex gap-x-2 items-center w-full">
				<div className="relative flex flex-row justify-center">
					<input
						id={`checkbox-item-${index}`}
						type="checkbox"
						value={role.title}
						checked={selectedRoleIds.includes(role.id)}
						onChange={(event) => handleCheckboxRoleChange(event, role?.id || '')}
						className="peer appearance-none forced-colors:appearance-auto relative w-4 h-4  border-theme-primary rounded-lg focus:outline-none"
						data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal.role_list.role_item.input')}
					/>
					<Icons.Check className="absolute invisible peer-checked:visible forced-colors:hidden w-4 h-4" />
				</div>
				{role.role_icon ? <img src={role.role_icon} alt="" className={'size-5'} /> : <Icons.RoleIcon defaultSize="w-5 h-5 min-w-5" />}
				<p
					className="text-sm one-line"
					data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.modal.role_list.role_item.title')}
				>
					{role.title}
				</p>
			</label>
		</div>
	));
};

export default ListRole;
