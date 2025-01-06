import { accountActions, useAppDispatch, userStatusActions } from '@mezon/store';
import { Dropdown } from 'flowbite-react';
import { ReactNode } from 'react';
import ItemStatus from './ItemStatus';

type ItemStatusUpdateProps = {
	children: string;
	dropdown?: boolean;
	type?: 'radio' | 'checkbox' | 'none';
	startIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
};

const ItemStatusUpdate = ({ children, dropdown, startIcon, type, onClick, disabled = false }: ItemStatusUpdateProps) => {
	const dispatch = useAppDispatch();
	const updateUserStatus = (status: string, minutes: number, untilTurnOn: boolean) => {
		dispatch(
			userStatusActions.updateUserStatus({
				status: status,
				minutes: minutes,
				until_turn_on: untilTurnOn
			})
		);
		dispatch(accountActions.updateUserStatus(status));
	};
	return (
		<Dropdown
			label=""
			trigger="click"
			dismissOnClick={true}
			renderTrigger={() => (
				<div>
					<ItemStatus children={children} dropdown={dropdown} startIcon={startIcon} />
				</div>
			)}
			placement="right-start"
			className="dark:!bg-bgSecondary600 !bg-white border ml-2 py-[6px] px-[8px] w-[200px]"
		>
			<ItemStatus children="For 30 Minutes" onClick={() => updateUserStatus(children, 30, false)} />
			<ItemStatus children="For 1 hour" onClick={() => updateUserStatus(children, 60, false)} />
			<ItemStatus children="For 3 hours" onClick={() => updateUserStatus(children, 30, false)} />
			<ItemStatus children="For 8 hours" onClick={() => updateUserStatus(children, 30, false)} />
			<ItemStatus children="For 24 hours" onClick={() => updateUserStatus(children, 30, false)} />
			<ItemStatus children="Forever" onClick={() => updateUserStatus(children, 0, true)} />
		</Dropdown>
	);
};

export default ItemStatusUpdate;
