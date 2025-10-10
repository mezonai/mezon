import { useAuth } from '@mezon/core';
import { accountActions, useAppDispatch } from '@mezon/store';
import { Menu } from '@mezon/ui';
import { notificationService } from '@mezon/utils';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ItemStatus from './ItemStatus';

type ItemStatusUpdateProps = {
	children: string;
	statusValue: string;
	dropdown?: boolean;
	type?: 'radio' | 'checkbox' | 'none';
	startIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	modalRef: React.MutableRefObject<boolean>;
};

const ItemStatusUpdate = ({ children, statusValue, dropdown, startIcon, onClick, modalRef }: ItemStatusUpdateProps) => {
	const { t } = useTranslation('userProfile');
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
		dispatch(accountActions.updateUserStatus(status));

		if (userProfile?.user?.id) {
			notificationService.setUserStatus(userProfile.user.id, status);
		}
	};

	const menu = useMemo(() => {
		const itemMenu: ReactElement[] = [
			<ItemStatus children={t('statusProfile.statusDuration.for30Minutes')} onClick={() => updateUserStatus(statusValue, 30, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children={t('statusProfile.statusDuration.for1Hour')} onClick={() => updateUserStatus(statusValue, 60, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children={t('statusProfile.statusDuration.for3Hours')} onClick={() => updateUserStatus(statusValue, 180, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children={t('statusProfile.statusDuration.for8Hours')} onClick={() => updateUserStatus(statusValue, 480, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children={t('statusProfile.statusDuration.for24Hours')} onClick={() => updateUserStatus(statusValue, 1440, false)} />,
			<div className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus children={t('statusProfile.statusDuration.forever')} onClick={() => updateUserStatus(statusValue, 0, true)} />
		];
		return <>{itemMenu}</>;
	}, [statusValue, updateUserStatus, t]);
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
