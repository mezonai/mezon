import { useAuth } from '@mezon/core';
import { accountActions, useAppDispatch } from '@mezon/store';
import { Menu } from '@mezon/ui';
import { notificationService, useAppLayout } from '@mezon/utils';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
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
	description?: string;
};

const ItemStatusUpdate = ({ children, statusValue, dropdown, startIcon, onClick, modalRef, description }: ItemStatusUpdateProps) => {
	const { t } = useTranslation('userProfile');
	const dispatch = useAppDispatch();
	const { isMobile } = useAppLayout();
	const { userProfile } = useAuth();
	const updateUserStatus = useCallback(
		(status: string, minutes: number, untilTurnOn: boolean) => {
			modalRef.current = false;
			onClick?.();
			dispatch(
				accountActions.updateAccountStatus({
					status,
					minutes,
					untilTurnOn: untilTurnOn
				})
			);
			dispatch(accountActions.updateUserStatus(status));

			if (userProfile?.user?.id) {
				notificationService.setUserStatus(userProfile.user.id, status);
			}
		},
		[dispatch, modalRef, onClick, userProfile?.user?.id]
	);

	const menu = useMemo(() => {
		const itemMenu: ReactElement[] = [
			<ItemStatus
				key="30min"
				children={t('statusProfile.statusDuration.for30Minutes')}
				onClick={() => updateUserStatus(statusValue, 30, false)}
			/>,
			<div key="div1" className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus key="1hour" children={t('statusProfile.statusDuration.for1Hour')} onClick={() => updateUserStatus(statusValue, 60, false)} />,
			<div key="div2" className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus
				key="3hours"
				children={t('statusProfile.statusDuration.for3Hours')}
				onClick={() => updateUserStatus(statusValue, 180, false)}
			/>,
			<div key="div3" className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus
				key="8hours"
				children={t('statusProfile.statusDuration.for8Hours')}
				onClick={() => updateUserStatus(statusValue, 480, false)}
			/>,
			<div key="div4" className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus
				key="24hours"
				children={t('statusProfile.statusDuration.for24Hours')}
				onClick={() => updateUserStatus(statusValue, 1440, false)}
			/>,
			<div key="div5" className="w-full border-b-[1px] border-[#40444b] opacity-70 text-center my-2"></div>,
			<ItemStatus key="forever" children={t('statusProfile.statusDuration.forever')} onClick={() => updateUserStatus(statusValue, 0, true)} />
		];
		return <>{itemMenu}</>;
	}, [statusValue, updateUserStatus, t]);
	return (
		<Menu
			menu={menu}
			trigger="click"
			className=" bg-theme-contexify text-theme-primary border ml-2 py-[6px] px-[8px] w-[200px] max-md:!mx-auto border-theme-primary "
			placement={isMobile ? 'bottom' : 'bottomRight'}
			align={
				isMobile
					? {
							offset: [0, 4],
							points: ['tc', 'bc']
						}
					: {
							offset: [0, 10],
							points: ['br']
						}
			}
		>
			<div>
				<ItemStatus children={children} description={description} dropdown={dropdown} startIcon={startIcon} />
			</div>
		</Menu>
	);
};

export default ItemStatusUpdate;
