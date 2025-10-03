import { useAuth } from '@mezon/core';
import { accountActions, clanMembersMetaActions, useAppDispatch } from '@mezon/store';
import { Menu } from '@mezon/ui';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import ItemStatus from './ItemStatus';

type ItemStatusUpdateProps = {
	children: string;
	dropdown?: boolean;
	type?: 'radio' | 'checkbox' | 'none';
	startIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	modalRef: React.MutableRefObject<boolean>;
};

const ItemStatusUpdate = ({ children, dropdown, startIcon, type, onClick, disabled = false, modalRef }: ItemStatusUpdateProps) => {
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();
	const updateUserStatus = (status: string, minutes: number, untilTurnOn: boolean) => {
		modalRef.current = false;
		onClick?.();
		dispatch(
			accountActions.updateAccountStatus({
				status,
				minutes,
				until_turn_on: untilTurnOn
			})
		);
		dispatch(clanMembersMetaActions.updateUserStatus({ userId: userProfile?.user?.id || '', user_status: status }));
		dispatch(accountActions.updateUserStatus(status));
	};

	const menu = useMemo(() => {
		const itemMenu: ReactElement[] = [
			<ItemStatus children="For 30 Minutes" onClick={() => updateUserStatus(children, 30, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children="For 1 hour" onClick={() => updateUserStatus(children, 60, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children="For 3 hours" onClick={() => updateUserStatus(children, 30, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children="For 8 hours" onClick={() => updateUserStatus(children, 30, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children="For 24 hours" onClick={() => updateUserStatus(children, 30, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children="Forever" onClick={() => updateUserStatus(children, 0, true)} />
		];
		return <>{itemMenu}</>;
	}, []);
	return (
		<Menu
			menu={menu}
			trigger="click"
			className=" bg-theme-contexify text-theme-primary border ml-2 py-[6px] px-[8px] w-[200px] border-theme-primary "
			placement="bottomRight"
			align={{
				offset: [0, 10],
				points: ['br']
			}}
		>
			<div>
				<ItemStatus children={children} dropdown={dropdown} startIcon={startIcon} />
			</div>
		</Menu>
	);
};

export default ItemStatusUpdate;
